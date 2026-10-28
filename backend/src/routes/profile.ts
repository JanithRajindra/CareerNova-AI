import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, UserProfile } from '../types';
import { AppError } from '../middleware/errorHandler';
import {
  dbDeleteAccountData,
  dbGetProfileAndPreferences,
  dbSaveProfileAndPreferences,
  getSupabaseAdmin,
} from '../services/supabaseService';

const profileStore: Map<string, UserProfile> = new Map();

export const profileRouter = Router();

// GET /api/v1/profile — Retrieve user profile and career targets
profileRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;

    // 1. Try reading from Supabase PostgreSQL tables
    const dbProfile = await dbGetProfileAndPreferences(userId);

    let profile: UserProfile;

    if (dbProfile) {
      profile = {
        id: userId,
        fullName: dbProfile.fullName || req.userEmail?.split('@')[0],
        country: dbProfile.country || 'Sri Lanka',
        preferredLocations: dbProfile.preferredLocations || [],
        preferredJobTitles: dbProfile.preferredJobTitles || [],
        experienceLevel: dbProfile.experienceLevel || 'mid',
        employmentPreferences: dbProfile.employmentPreferences || ['Full-time'],
        remotePreference: dbProfile.remotePreference || 'hybrid',
        preferredIndustries: dbProfile.preferredIndustries || ['Technology & SaaS'],
        salaryRange: dbProfile.salaryRange || { min: 80000, max: 150000, currency: 'USD' },
        createdAt: new Date().toISOString(),
        updatedAt: dbProfile.updatedAt || new Date().toISOString(),
      };
      profileStore.set(userId, profile);
    } else {
      // Fallback to in-memory store
      profile = profileStore.get(userId) || {
        id: userId,
        fullName: req.userEmail?.split('@')[0] || 'User',
        country: 'Sri Lanka',
        preferredLocations: ['Colombo, Sri Lanka', 'Remote'],
        preferredJobTitles: ['Senior Full Stack Engineer'],
        experienceLevel: 'mid',
        employmentPreferences: ['Full-time'],
        remotePreference: 'hybrid',
        preferredIndustries: ['Technology & SaaS'],
        salaryRange: { min: 80000, max: 150000, currency: 'USD' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      profileStore.set(userId, profile);
    }

    res.json({ success: true, data: profile } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/profile — Update profile & career targets
profileRouter.patch('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const existing = profileStore.get(userId) || {
      id: userId,
      preferredLocations: [],
      preferredJobTitles: [],
      employmentPreferences: [],
      preferredIndustries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const {
      fullName,
      country,
      preferredLocations,
      preferredJobTitles,
      experienceLevel,
      employmentPreferences,
      remotePreference,
      preferredIndustries,
      salaryRange,
    } = req.body as Partial<UserProfile>;

    // Basic validation
    if (salaryRange && salaryRange.min !== undefined && salaryRange.max !== undefined) {
      if (salaryRange.min < 0 || salaryRange.max < 0) {
        throw new AppError('Salary amounts cannot be negative.', 400);
      }
      if (salaryRange.min > salaryRange.max) {
        throw new AppError('Minimum salary cannot exceed maximum salary.', 400);
      }
    }

    const updated: UserProfile = {
      ...existing,
      fullName: fullName !== undefined ? fullName : existing.fullName,
      country: country !== undefined ? country : existing.country,
      preferredLocations: preferredLocations !== undefined ? preferredLocations : existing.preferredLocations,
      preferredJobTitles: preferredJobTitles !== undefined ? preferredJobTitles : existing.preferredJobTitles,
      experienceLevel: experienceLevel !== undefined ? experienceLevel : existing.experienceLevel,
      employmentPreferences: employmentPreferences !== undefined ? employmentPreferences : existing.employmentPreferences,
      remotePreference: remotePreference !== undefined ? remotePreference : existing.remotePreference,
      preferredIndustries: preferredIndustries !== undefined ? preferredIndustries : existing.preferredIndustries,
      salaryRange: salaryRange !== undefined ? salaryRange : existing.salaryRange,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to Supabase PostgreSQL database tables
    await dbSaveProfileAndPreferences(userId, updated);

    // 2. Cache in local store
    profileStore.set(userId, updated);

    res.json({
      success: true,
      data: updated,
      message: 'Profile and preferences updated successfully in Supabase.',
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/profile/account — Delete account and all associated records
profileRouter.delete('/account', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    profileStore.delete(userId);

    // 1. Delete user database records via cascade delete
    await dbDeleteAccountData(userId);

    // 2. Delete user account from Supabase Auth admin
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.warn('[Auth] Delete auth user warning:', (authErr as Error).message);
      }
    }

    res.json({
      success: true,
      message: 'Account, authentication credentials, and all associated data deleted successfully.',
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
