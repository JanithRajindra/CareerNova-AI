import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { resumeStore } from './resumes';
import { calculateATSScore } from '../services/atsScoringService';
import { aiResumeService } from '../services/aiResumeService';
import { dbSaveAnalysis, dbGetUserAnalyses, dbGetResumeById } from '../services/supabaseService';
import { ApiResponse, ATSScore } from '../types';

// In-memory analysis store
interface AnalysisRecord {
  id: string;
  userId: string;
  resumeId: string;
  score: ATSScore;
  targetJobDescription?: string;
  targetJobTitle?: string;
  createdAt: string;
}

const analysisStore: Map<string, AnalysisRecord> = new Map();
const suggestionStore: Map<string, SuggestionRecord[]> = new Map();

interface SuggestionRecord {
  id: string;
  userId: string;
  resumeId: string;
  analysisId?: string;
  section: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected';
  type: string;
  createdAt: string;
}

export const analysisRouter = Router();

// POST /api/v1/resumes/:id/analyze
analysisRouter.post('/resumes/:id/analyze', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    let resume: any = resumeStore.get(id);
    if (!resume) {
      resume = await dbGetResumeById(id, req.userId!);
    }
    if (!resume) throw new AppError('Resume not found', 404);
    if (resume.userId !== req.userId) throw new AppError('Access denied', 403);

    const { targetJobDescription, targetJobTitle } = req.body as {
      targetJobDescription?: string;
      targetJobTitle?: string;
    };

    const score = calculateATSScore({
      parsed: resume.parsedContent,
      targetJobDescription,
      targetJobTitle,
    });

    const record: AnalysisRecord = {
      id: uuidv4(),
      userId: req.userId!,
      resumeId: resume.id,
      score,
      targetJobDescription,
      targetJobTitle,
      createdAt: new Date().toISOString(),
    };

    analysisStore.set(record.id, record);

    // Persist to Supabase if configured
    await dbSaveAnalysis({
      id: record.id,
      userId: record.userId,
      resumeId: record.resumeId,
      score,
      targetJobTitle,
      targetJobDescription,
    });

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        resumeId: resume.id,
        score,
        targetJobTitle,
        hasTargetJob: !!targetJobDescription,
        createdAt: record.createdAt,
      },
      message: 'ATS analysis completed successfully',
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analyses — List user's analyses
analysisRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const dbAnalyses = await dbGetUserAnalyses(req.userId!);
  if (dbAnalyses && dbAnalyses.length > 0) {
    return res.json({ success: true, data: dbAnalyses } as ApiResponse);
  }

  const userAnalyses = Array.from(analysisStore.values())
    .filter((a) => a.userId === req.userId)
    .map((a) => ({
      id: a.id,
      resumeId: a.resumeId,
      overallScore: a.score.overall,
      band: a.score.band,
      bandLabel: a.score.bandLabel,
      targetJobTitle: a.targetJobTitle,
      createdAt: a.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: userAnalyses } as ApiResponse);
});

// GET /api/v1/analyses/:id
analysisRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    const analysis = analysisStore.get(id);
    if (!analysis) throw new AppError('Analysis not found', 404);
    if (analysis.userId !== req.userId) throw new AppError('Access denied', 403);

    res.json({ success: true, data: analysis } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/analyses/:id/suggestions — Generate AI improvement suggestions
analysisRouter.post('/:id/suggestions', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    const analysis = analysisStore.get(id);
    if (!analysis) throw new AppError('Analysis not found', 404);
    if (analysis.userId !== req.userId) throw new AppError('Access denied', 403);

    const resume = resumeStore.get(analysis.resumeId);
    if (!resume) throw new AppError('Associated resume not found', 404);

    const aiResult = await aiResumeService.generateSuggestions(
      resume.parsedContent,
      analysis.targetJobTitle
    );

    const suggestions: SuggestionRecord[] = aiResult.suggestions.map((s) => ({
      id: uuidv4(),
      userId: req.userId!,
      resumeId: analysis.resumeId,
      analysisId: analysis.id,
      section: s.section,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation,
      status: 'pending',
      type: s.type,
      createdAt: new Date().toISOString(),
    }));

    suggestionStore.set(analysis.id, suggestions);

    res.json({
      success: true,
      data: {
        suggestions,
        overallFeedback: aiResult.overallFeedback,
        isAIGenerated: aiResult.isAIGenerated,
        provider: aiResult.provider,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/suggestions/:id — Update suggestion status
analysisRouter.patch('/suggestions/:id', authenticate, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status } = req.body as { status: 'accepted' | 'rejected' | 'pending' };
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Find suggestion across all analysis suggestion lists
    const suggestionId = req.params['id'] as string;
    for (const [analysisId, suggestions] of suggestionStore) {
      const idx = suggestions.findIndex((s) => s.id === suggestionId);
      if (idx !== -1) {
        if (suggestions[idx].userId !== req.userId) throw new AppError('Access denied', 403);
        suggestions[idx].status = status;
        suggestionStore.set(analysisId, suggestions);
        return res.json({ success: true, data: suggestions[idx] } as ApiResponse);
      }
    }

    throw new AppError('Suggestion not found', 404);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/job-matches/analyze-description — Compare CV to a JD
analysisRouter.post('/job-matches/analyze-description', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { resumeId, jobDescription } = req.body as {
      resumeId: string;
      jobDescription: string;
    };

    if (!resumeId || !jobDescription) {
      throw new AppError('resumeId and jobDescription are required', 400);
    }

    const resume = resumeStore.get(resumeId);
    if (!resume) throw new AppError('Resume not found', 404);
    if (resume.userId !== req.userId) throw new AppError('Access denied', 403);

    if (jobDescription.trim().length < 50) {
      throw new AppError('Job description is too short. Please provide more detail.', 400);
    }

    const aiResult = await aiResumeService.analyzeForJobDescription(
      resume.parsedContent,
      jobDescription
    );

    // Also run deterministic ATS with the JD
    const atsScore = calculateATSScore({
      parsed: resume.parsedContent,
      targetJobDescription: jobDescription,
    });

    res.json({
      success: true,
      data: {
        atsScore,
        aiSuggestions: aiResult.suggestions,
        overallFeedback: aiResult.overallFeedback,
        isAIGenerated: aiResult.isAIGenerated,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
