import { Router, Response, Request } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { resumeStore } from './resumes';
import {
  dbGetResumeById,
  dbSaveSavedJob,
  dbRemoveSavedJob,
  dbGetUserSavedJobIds,
  dbSaveJobMatch,
} from '../services/supabaseService';
import { calculateJobMatch } from '../services/jobMatchingService';
import { getActiveJobListings } from '../services/jobProviderService';
import { ApiResponse, JobListing, JobMatch } from '../types';

// In-memory fallback sets for local/offline testing
const savedJobsStore: Map<string, Set<string>> = new Map(); // userId -> Set<jobId>
const jobMatchStore: Map<string, JobMatch> = new Map();

export const jobsRouter = Router();

// GET /api/v1/jobs — Browse all verified vacancies across all industries with generalized filters
jobsRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const {
      title,
      query,
      category,
      country,
      location,
      employmentType,
      workplaceType,
      experienceLevel,
      portal,
      verifiedOnly,
      page = '1',
      limit = '50',
      sort = 'recent',
    } = req.query as Record<string, string>;

    let jobs = await getActiveJobListings();

    // 1. Text Search (title, company, skills, description)
    const searchTerm = (query || title || '').trim().toLowerCase();
    if (searchTerm) {
      jobs = jobs.filter((j) => {
        const inTitle = j.title.toLowerCase().includes(searchTerm);
        const inCompany = j.company.toLowerCase().includes(searchTerm);
        const inDesc = j.description.toLowerCase().includes(searchTerm);
        const inSkills = [...(j.requiredSkills || []), ...(j.preferredSkills || [])].some((s) =>
          s.toLowerCase().includes(searchTerm)
        );
        return inTitle || inCompany || inDesc || inSkills;
      });
    }

    // 2. Industry / Category Filter
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      jobs = jobs.filter((j) => (j.category || '').toLowerCase().includes(catLower));
    }

    // 3. Location / Country Filter
    if (location && location !== 'all') {
      const locLower = location.toLowerCase();
      jobs = jobs.filter((j) => j.location.toLowerCase().includes(locLower));
    }
    if (country) {
      jobs = jobs.filter(
        (j) =>
          j.country.toLowerCase() === country.toLowerCase() ||
          j.location.toLowerCase().includes(country.toLowerCase())
      );
    }

    // 4. Employment & Workplace Type
    if (employmentType && employmentType !== 'all') {
      jobs = jobs.filter((j) => j.employmentType?.toLowerCase() === employmentType.toLowerCase());
    }
    if (workplaceType && workplaceType !== 'all') {
      jobs = jobs.filter((j) => j.workplaceType?.toLowerCase() === workplaceType.toLowerCase());
    }

    // 5. Experience Level
    if (experienceLevel && experienceLevel !== 'all') {
      const expLower = experienceLevel.toLowerCase();
      jobs = jobs.filter((j) => (j.experienceRequirements || '').toLowerCase().includes(expLower));
    }

    // 6. Source / Portal Filter
    if (portal && portal !== 'all') {
      const portalLower = portal.toLowerCase();
      jobs = jobs.filter((j) => (j.providerName || '').toLowerCase().includes(portalLower));
    }

    // 7. Verified Only Filter
    if (verifiedOnly === 'true') {
      jobs = jobs.filter((j) => j.sourceStatus === 'verified');
    }

    // 8. Sorting
    if (sort === 'recent') {
      jobs.sort(
        (a, b) => new Date(b.postingDate || 0).getTime() - new Date(a.postingDate || 0).getTime()
      );
    } else if (sort === 'title') {
      jobs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'company') {
      jobs.sort((a, b) => a.company.localeCompare(b.company));
    }

    // 9. Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paginated = jobs.slice(start, start + limitNum);

    res.json({
      success: true,
      data: paginated,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / limitNum),
        liveCount: jobs.length,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/recommendations — Genuine AI match recommendations for selected CV
jobsRouter.get('/recommendations', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      resumeId,
      minMatch = '0',
      category,
      location,
      employmentType,
      workplaceType,
    } = req.query as {
      resumeId?: string;
      minMatch?: string;
      category?: string;
      location?: string;
      employmentType?: string;
      workplaceType?: string;
    };

    if (!resumeId) {
      throw new AppError('resumeId query parameter is required to generate personalized recommendations', 400);
    }

    let resume = resumeStore.get(resumeId);
    if (!resume) {
      resume = await dbGetResumeById(resumeId, req.userId!);
    }
    if (!resume) {
      throw new AppError('The selected CV was not found. Please select or upload a valid resume.', 404);
    }
    if (resume.userId !== req.userId) {
      throw new AppError('Access denied: You can only generate recommendations for your own CV', 403);
    }

    const minScore = parseInt(minMatch) || 0;
    let allJobs = await getActiveJobListings();

    // Optional category/industry filtering before matching
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      allJobs = allJobs.filter((j) => (j.category || '').toLowerCase().includes(catLower));
    }
    if (location && location !== 'all') {
      const locLower = location.toLowerCase();
      allJobs = allJobs.filter((j) => j.location.toLowerCase().includes(locLower));
    }
    if (employmentType && employmentType !== 'all') {
      allJobs = allJobs.filter((j) => j.employmentType?.toLowerCase() === employmentType.toLowerCase());
    }
    if (workplaceType && workplaceType !== 'all') {
      allJobs = allJobs.filter((j) => j.workplaceType?.toLowerCase() === workplaceType.toLowerCase());
    }

    // Retrieve user's saved jobs list to attach isSaved state
    let savedIds: string[] = [];
    const dbSaved = await dbGetUserSavedJobIds(req.userId!);
    if (dbSaved) {
      savedIds = dbSaved;
    } else {
      savedIds = Array.from(savedJobsStore.get(req.userId!) || []);
    }

    // Match selected candidate CV against verified vacancies with deterministic weights
    const matches: JobMatch[] = allJobs
      .map((job) => calculateJobMatch(resume.parsedContent, job))
      .filter((m) => m.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Persist matches asynchronously in PostgreSQL job_matches table
    for (const match of matches) {
      jobMatchStore.set(`${req.userId}-${match.jobListing.id}`, match);
      // Fire-and-forget database persistence (does not block response)
      dbSaveJobMatch(match, req.userId!, resumeId).catch((err) => {
        console.warn('[JobMatches] Persist notice:', (err as Error).message);
      });
    }

    // Enrich each match with isSaved flag
    const enriched = matches.map((m) => ({
      ...m,
      isSaved: savedIds.includes(m.jobListing.id),
    }));

    res.json({
      success: true,
      data: enriched,
      meta: {
        total: enriched.length,
        liveMatchCount: enriched.length,
        activeResumeId: resumeId,
        candidateName: resume.parsedContent?.fullName || 'Candidate',
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/:id — Get details for a specific vacancy
jobsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const jobId = req.params['id'] as string;
    const allJobs = await getActiveJobListings();
    const job = allJobs.find((j) => j.id === jobId);

    if (!job) throw new AppError('Job listing not found', 404);

    res.json({ success: true, data: job } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/jobs/:id/save — Save a job (persisted to Supabase saved_jobs table with RLS)
jobsRouter.post('/:id/save', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const jobId = req.params['id'] as string;
    const allJobs = await getActiveJobListings();
    const job = allJobs.find((j) => j.id === jobId);
    if (!job) throw new AppError('Job listing not found', 404);

    const userId = req.userId!;

    // Save to database
    await dbSaveSavedJob(userId, job.id);

    // Update in-memory fallback
    if (!savedJobsStore.has(userId)) savedJobsStore.set(userId, new Set());
    savedJobsStore.get(userId)!.add(job.id);

    res.json({ success: true, message: 'Job successfully saved to your bookmarks' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/jobs/:id/save — Remove a saved job
jobsRouter.delete('/:id/save', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const jobId = req.params['id'] as string;

    // Remove from database
    await dbRemoveSavedJob(userId, jobId);

    // Update in-memory fallback
    savedJobsStore.get(userId)?.delete(jobId);

    res.json({ success: true, message: 'Job removed from saved list' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/user/saved — Get all saved jobs for authenticated user
jobsRouter.get('/user/saved', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;

    // Query database with fallback to in-memory store
    let savedIds: string[] = [];
    const dbSaved = await dbGetUserSavedJobIds(userId);
    if (dbSaved) {
      savedIds = dbSaved;
    } else {
      savedIds = Array.from(savedJobsStore.get(userId) || []);
    }

    const allJobs = await getActiveJobListings();
    const savedJobs = allJobs
      .filter((j) => savedIds.includes(j.id))
      .map((j) => ({
        ...j,
        isSaved: true,
      }));

    res.json({
      success: true,
      data: savedJobs,
      meta: {
        total: savedJobs.length,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
