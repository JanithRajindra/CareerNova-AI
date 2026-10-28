import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { extractClientIp, inferLocation, recordUserActivity } from '../services/auditLogger';

let authClientInstance: ReturnType<typeof createClient> | null = null;
function getAuthClient() {
  if (!authClientInstance) {
    authClientInstance = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return authClientInstance;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  file?: any;
  files?: any;
}

/**
 * Enforces real Supabase JWT token authentication.
 * Verifies with Supabase Auth server and sets req.userId / req.userEmail.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token || token === 'demo-token') {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in with your account to access this feature.',
      });
      return;
    }

    const supabase = getAuthClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please sign in again.',
      });
      return;
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;

    // Track user session activity (IP address, user agent, location)
    try {
      const clientIp = extractClientIp(req);
      const location = inferLocation(clientIp, req);
      const ua = req.headers['user-agent'];
      recordUserActivity({
        userId: data.user.id,
        userEmail: data.user.email || 'unknown',
        ip: clientIp,
        userAgent: ua,
        location,
        action: `${req.method} ${req.originalUrl || req.path}`,
      });
    } catch {
      // Non-blocking audit failure
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — sets userId if valid token is present, proceeds without userId otherwise.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token && token !== 'demo-token') {
      const supabase = getAuthClient();
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        req.userId = data.user.id;
        req.userEmail = data.user.email;
      }
    }
    next();
  } catch {
    next();
  }
};