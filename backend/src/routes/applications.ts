import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getActiveJobListings } from '../services/jobProviderService';
import { dbSaveApplication, dbGetUserApplications } from '../services/supabaseService';
import { ApiResponse, JobApplication, ApplicationStatus } from '../types';

// In-memory application tracking store
const applicationStore: Map<string, JobApplication> = new Map();

const VALID_STATUSES: ApplicationStatus[] = [
  'interested', 'saved', 'preparing', 'applied',
  'interview', 'offer', 'rejected', 'withdrawn',
];

export const applicationsRouter = Router();

// GET /api/v1/applications
applicationsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query as { status?: string };

  let apps = await dbGetUserApplications(req.userId!, status);
  if (!apps) {
    apps = Array.from(applicationStore.values()).filter((a) => a.userId === req.userId);
    if (status) apps = apps.filter((a) => a.status === status);
  }

  apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Attach job listing data from live and demo listings
  const allJobs = await getActiveJobListings();
  const enriched = apps.map((app) => ({
    ...app,
    jobListing: allJobs.find((j) => j.id === app.jobListingId),
  }));

  res.json({ success: true, data: enriched } as ApiResponse);
});

// POST /api/v1/applications
applicationsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { jobListingId, resumeId, status = 'interested', notes, followUpAt } = req.body as {
      jobListingId: string;
      resumeId?: string;
      status?: ApplicationStatus;
      notes?: string;
      followUpAt?: string;
    };

    if (!jobListingId) throw new AppError('jobListingId is required', 400);
    if (!VALID_STATUSES.includes(status)) throw new AppError(`Invalid status. Valid: ${VALID_STATUSES.join(', ')}`, 400);

    // Check for duplicate
    const existing = Array.from(applicationStore.values()).find(
      (a) => a.userId === req.userId && a.jobListingId === jobListingId
    );
    if (existing) throw new AppError('You already have an application for this job', 409);

    const app: JobApplication = {
      id: uuidv4(),
      userId: req.userId!,
      jobListingId,
      resumeId,
      status,
      appliedAt: status === 'applied' ? new Date().toISOString() : undefined,
      notes: notes || '',
      followUpAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    applicationStore.set(app.id, app);
    await dbSaveApplication(app);

    const allJobs = await getActiveJobListings();

    res.status(201).json({
      success: true,
      data: {
        ...app,
        jobListing: allJobs.find((j) => j.id === jobListingId),
      },
      message: 'Application tracked successfully',
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/applications/:id
applicationsRouter.patch('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const appId = req.params['id'] as string;
    const app = applicationStore.get(appId);
    if (!app) throw new AppError('Application not found', 404);
    if (app.userId !== req.userId) throw new AppError('Access denied', 403);

    const { status, notes, followUpAt, resumeId } = req.body as Partial<JobApplication>;

    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Valid: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const updated: JobApplication = {
      ...app,
      status: status || app.status,
      notes: notes !== undefined ? notes : app.notes,
      followUpAt: followUpAt !== undefined ? followUpAt : app.followUpAt,
      resumeId: resumeId || app.resumeId,
      appliedAt: status === 'applied' && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
      updatedAt: new Date().toISOString(),
    };

    applicationStore.set(app.id, updated);

    res.json({ success: true, data: updated } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/applications/:id
applicationsRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const appId = req.params['id'] as string;
    const app = applicationStore.get(appId);
    if (!app) throw new AppError('Application not found', 404);
    if (app.userId !== req.userId) throw new AppError('Access denied', 403);

    applicationStore.delete(app.id);
    res.json({ success: true, message: 'Application deleted' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
