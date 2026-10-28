import { Router, Response, Request } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { resumeStore } from './resumes';
import { dbGetResumeById } from '../services/supabaseService';
import { calculateJobMatch } from '../services/jobMatchingService';
import { getActiveJobListings } from '../services/jobProviderService';
import { ApiResponse, JobListing, JobMatch } from '../types';

const savedJobsStore: Map<string, Set<string>> = new Map(); // userId -> Set<jobId>
const jobMatchStore: Map<string, JobMatch> = new Map();

export const jobsRouter = Router();

// GET /api/v1/jobs — Browse all available live and verified jobs with filters
jobsRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const {
      title,
      country,
      location,
      employmentType,
      workplaceType,
      page = '1',
      limit = '12',
      sort = 'recent',
    } = req.query as Record<string, string>;

    let jobs = await getActiveJobListings();

    // Filters
    if (title) {
      const q = title.toLowerCase();
      jobs = jobs.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
    }
    if (country) {
      jobs = jobs.filter(
        (j) => j.country.toLowerCase() === country.toLowerCase() || j.location.toLowerCase().includes(country.toLowerCase())
      );
    }
    if (location) {
      jobs = jobs.filter((j) => j.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (employmentType) {
      jobs = jobs.filter((j) => j.employmentType?.toLowerCase() === employmentType.toLowerCase());
    }
    if (workplaceType) {
      jobs = jobs.filter((j) => j.workplaceType?.toLowerCase() === workplaceType.toLowerCase());
    }

    // Sort
    if (sort === 'recent') {
      jobs.sort((a, b) => new Date(b.postingDate || 0).getTime() - new Date(a.postingDate || 0).getTime());
    } else if (sort === 'title') {
      jobs.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
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

// GET /api/v1/jobs/recommendations — Get personalized recommendations for uploaded CV
jobsRouter.get('/recommendations', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { resumeId, minMatch = '0' } = req.query as { resumeId?: string; minMatch?: string };

    if (!resumeId) {
      throw new AppError('resumeId query parameter is required', 400);
    }

    let resume = resumeStore.get(resumeId);
    if (!resume) {
      resume = await dbGetResumeById(resumeId, req.userId!);
    }
    if (!resume) throw new AppError('Resume not found. Please upload a CV first.', 404);
    if (resume.userId !== req.userId) throw new AppError('Access denied', 403);

    const minScore = parseInt(minMatch) || 0;
    const allJobs = await getActiveJobListings();

    // Match candidate CV against all live jobs
    const matches: JobMatch[] = allJobs
      .map((job) => calculateJobMatch(resume.parsedContent, job))
      .filter((m) => m.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Cache computed matches
    for (const match of matches) {
      jobMatchStore.set(`${req.userId}-${match.jobListing.id}`, match);
    }

    res.json({
      success: true,
      data: matches,
      meta: {
        total: matches.length,
        liveMatchCount: matches.length,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/:id — Get specific job details
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

// POST /api/v1/jobs/:id/save — Save a job
jobsRouter.post('/:id/save', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const jobId = req.params['id'] as string;
    const allJobs = await getActiveJobListings();
    const job = allJobs.find((j) => j.id === jobId);
    if (!job) throw new AppError('Job listing not found', 404);

    const userId = req.userId!;
    if (!savedJobsStore.has(userId)) savedJobsStore.set(userId, new Set());
    savedJobsStore.get(userId)!.add(job.id);

    res.json({ success: true, message: 'Job saved successfully' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/jobs/:id/save — Remove saved job
jobsRouter.delete('/:id/save', authenticate, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const jobId = req.params['id'] as string;
    savedJobsStore.get(userId)?.delete(jobId);
    res.json({ success: true, message: 'Job removed from saved list' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/saved — Get saved jobs
jobsRouter.get('/user/saved', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const savedIds = Array.from(savedJobsStore.get(userId) || []);
    const allJobs = await getActiveJobListings();
    const savedJobs = allJobs.filter((j) => savedIds.includes(j.id));

    res.json({ success: true, data: savedJobs } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
