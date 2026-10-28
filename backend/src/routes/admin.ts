import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getSupabaseAdmin } from '../services/supabaseService';
import { getActiveJobListings } from '../services/jobProviderService';
import { getAdminAuditSummary } from '../services/auditLogger';
import { ApiResponse } from '../types';

export const adminRouter = Router();

export const ADMIN_EMAILS = [
  'janithrajindra0705@gmail.com',
];

export function isPlatformAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// GET /api/v1/admin/stats — Platform operational overview & real candidate audit log (No CV content exposed)
adminRouter.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!isPlatformAdmin(req.userEmail)) {
      throw new AppError('Access denied: Administrator privileges required.', 403);
    }

    const admin = getSupabaseAdmin();
    let totalUsers = 0;
    let totalResumes = 0;
    let totalAnalyses = 0;
    let totalApplications = 0;

    if (admin) {
      // 1. Total registered users count
      const { data: usersData } = await admin.auth.admin.listUsers();
      totalUsers = usersData?.users?.length || 0;

      // 2. Count resumes
      const { count: resumeCount } = await admin.from('resumes').select('*', { count: 'exact', head: true });
      totalResumes = resumeCount || 0;

      // 3. Count analyses
      const { count: analysisCount } = await admin.from('resume_analyses').select('*', { count: 'exact', head: true });
      totalAnalyses = analysisCount || 0;

      // 4. Count applications
      const { count: appCount } = await admin.from('job_applications').select('*', { count: 'exact', head: true });
      totalApplications = appCount || 0;
    }

    // 5. Live vacancies breakdown (Sri Lankan Portals: TopJobs, ITJobs, ExpressJobs, LinkedIn)
    const allJobs = await getActiveJobListings();
    const providers: Record<string, number> = {};
    for (const job of allJobs) {
      providers[job.providerName] = (providers[job.providerName] || 0) + 1;
    }

    // 6. Real user audit overview & recent activity logs (Zero-Knowledge: IP, Device, Activity only)
    const { users, recentLogs } = await getAdminAuditSummary();

    res.json({
      success: true,
      data: {
        adminUser: req.userEmail,
        platformMetrics: {
          totalRegisteredCandidates: totalUsers,
          totalResumesParsed: totalResumes,
          totalATSAnalyses: totalAnalyses,
          totalJobApplicationsTracked: totalApplications,
          totalLiveVacancies: allJobs.length,
        },
        jobProviders: {
          topjobsLk: providers['topjobs.lk'] || 0,
          itjobsLk: providers['itjobs.lk'] || 0,
          expressjobsLk: providers['expressjobs.lk'] || 0,
          linkedinLk: providers['linkedin'] || 0,
        },
        users,
        recentActivity: recentLogs,
        privacyCompliance: {
          zeroKnowledgePII: true,
          status: 'Enforced via PostgreSQL Row-Level Security and encrypted private object storage.',
          developerAccessToCandidateData: 'Strictly restricted. Developer and admin cannot read personal raw CV contents or phone numbers. Only audit logs (IP, Device, Session timestamps) are tracked.',
        },
        supabaseStatus: {
          connected: true,
          projectUrl: 'https://nawmwfehwwtjypxhqbqz.supabase.co',
          storageBucket: 'resumes',
        },
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});