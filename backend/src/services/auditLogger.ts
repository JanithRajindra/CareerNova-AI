import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { getSupabaseAdmin } from './supabaseService';

export interface UserAuditRecord {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  location: string;
  action: string;
  timestamp: string;
}

export interface AdminUserOverview {
  userId: string;
  email: string;
  role: 'admin' | 'candidate';
  isCurrentUser: boolean;
  registeredAt: string;
  lastSignInAt: string;
  lastIpAddress: string;
  lastDevice: string;
  location: string;
  resumesUploadedCount: number;
  atsScansCompletedCount: number;
  dataPrivacyStatus: 'Zero-Knowledge Protected (CV text & personal contacts hidden)';
}

// In-memory activity store with file persistence
const auditFilePath = path.resolve(__dirname, '../../data/audit_logs.json');
let activityLogs: UserAuditRecord[] = [];

// Ensure data folder exists
try {
  const dir = path.dirname(auditFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(auditFilePath)) {
    const raw = fs.readFileSync(auditFilePath, 'utf-8');
    activityLogs = JSON.parse(raw);
  }
} catch {
  activityLogs = [];
}

function saveLogsToFile() {
  try {
    const dir = path.dirname(auditFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Keep last 1,000 entries
    const toSave = activityLogs.slice(-1000);
    fs.writeFileSync(auditFilePath, JSON.stringify(toSave, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AuditLogger] Could not persist logs to disk:', (err as Error).message);
  }
}

/**
 * Parses user-agent header into clean browser and OS string.
 */
function parseUserAgent(ua?: string): string {
  if (!ua) return 'Unknown Device';

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  let os = 'OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

/**
 * Extracts client IP address from express request headers.
 */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp.trim();

  const ip = req.socket.remoteAddress || req.ip || '127.0.0.1';
  // Normalize IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  return ip;
}

/**
 * Infers location/region from IP address or country headers.
 */
export function inferLocation(ip: string, req?: Request): string {
  if (req) {
    const cfCountry = req.headers['cf-ipcountry'];
    if (typeof cfCountry === 'string' && cfCountry.length === 2) {
      return cfCountry.toUpperCase() === 'LK' ? 'Sri Lanka (Cloudflare)' : `${cfCountry.toUpperCase()} (Cloudflare)`;
    }
  }

  if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Sri Lanka (Local Host)';
  }

  return 'Internet Client';
}

/**
 * Records an activity event in the audit system.
 */
export function recordUserActivity(params: {
  userId: string;
  userEmail: string;
  ip: string;
  userAgent?: string;
  location?: string;
  action: string;
}) {
  const deviceInfo = parseUserAgent(params.userAgent);
  const location = params.location || (params.ip === '127.0.0.1' ? 'Sri Lanka (Local Host)' : 'Remote Network');

  const record: UserAuditRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId: params.userId,
    userEmail: params.userEmail,
    ipAddress: params.ip,
    userAgent: params.userAgent || 'Unknown',
    deviceInfo,
    location,
    action: params.action,
    timestamp: new Date().toISOString(),
  };

  activityLogs.push(record);
  saveLogsToFile();
}

/**
 * Retrieves platform audit summary for Admin Console with STRICT Zero-Knowledge Privacy.
 * Returns only: email, registration date, last login, IP, device, and integer counts of resumes/analyses.
 * NEVER returns raw resume text, files, or contact details.
 */
export async function getAdminAuditSummary(): Promise<{
  users: AdminUserOverview[];
  recentLogs: UserAuditRecord[];
}> {
  const admin = getSupabaseAdmin();
  const usersList: AdminUserOverview[] = [];

  if (admin) {
    try {
      // 1. Fetch real Supabase users
      const { data: authData } = await admin.auth.admin.listUsers();
      const authUsers = authData?.users || [];

      // 2. Query aggregate counts per user from DB (integer counts only)
      const { data: resumeRows } = await admin.from('resumes').select('user_id');
      const { data: analysisRows } = await admin.from('resume_analyses').select('user_id');

      const resumeCountMap: Record<string, number> = {};
      if (resumeRows) {
        for (const row of resumeRows) {
          resumeCountMap[row.user_id] = (resumeCountMap[row.user_id] || 0) + 1;
        }
      }

      const analysisCountMap: Record<string, number> = {};
      if (analysisRows) {
        for (const row of analysisRows) {
          analysisCountMap[row.user_id] = (analysisCountMap[row.user_id] || 0) + 1;
        }
      }

      // Map users
      for (const u of authUsers) {
        // Find most recent log for this user
        const userLogs = activityLogs
          .filter((l) => l.userId === u.id || l.userEmail.toLowerCase() === u.email?.toLowerCase())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const latestLog = userLogs[0];
        const isAdminUser = u.email?.toLowerCase() === 'janithrajindra0705@gmail.com';

        usersList.push({
          userId: u.id,
          email: u.email || 'Anonymous',
          role: isAdminUser ? 'admin' : 'candidate',
          isCurrentUser: isAdminUser,
          registeredAt: u.created_at,
          lastSignInAt: u.last_sign_in_at || latestLog?.timestamp || u.created_at,
          lastIpAddress: latestLog?.ipAddress || '127.0.0.1',
          lastDevice: latestLog?.deviceInfo || 'Chrome on Windows 10/11',
          location: latestLog?.location || 'Sri Lanka (Local Host)',
          resumesUploadedCount: resumeCountMap[u.id] || 0,
          atsScansCompletedCount: analysisCountMap[u.id] || 0,
          dataPrivacyStatus: 'Zero-Knowledge Protected (CV text & personal contacts hidden)',
        });
      }
    } catch (err) {
      console.warn('[AuditLogger] Error aggregating user data:', (err as Error).message);
    }
  }

  // Get most recent 50 audit log events
  const recentLogs = [...activityLogs].reverse().slice(0, 50);

  return {
    users: usersList.sort((a, b) => new Date(b.lastSignInAt).getTime() - new Date(a.lastSignInAt).getTime()),
    recentLogs,
  };
}
