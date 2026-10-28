import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseService';
import { AppError } from '../middleware/errorHandler';
import { extractClientIp, inferLocation, recordUserActivity } from '../services/auditLogger';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/v1/auth/register — Direct instant account creation in Supabase
authRouter.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      throw new AppError('Supabase administrative service is unavailable', 500);
    }

    // Create user directly in Supabase with verified status
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name?.trim() || email.split('@')[0] },
    });

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('exists')) {
        throw new AppError('An account with this email already exists. Please sign in.', 409);
      }
      throw new AppError(error.message, 400);
    }

    // Track registration event
    const clientIp = extractClientIp(req);
    recordUserActivity({
      userId: data.user.id,
      userEmail: data.user.email || email.trim(),
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      location: inferLocation(clientIp, req),
      action: 'Account Created & Confirmed',
    });

    res.status(201).json({
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
        confirmed: true,
      },
      message: 'Account created and confirmed successfully in Supabase.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/session — Explicitly report successful login from client
authRouter.post('/session', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const clientIp = extractClientIp(req);
  recordUserActivity({
    userId: req.userId!,
    userEmail: req.userEmail || 'unknown',
    ip: clientIp,
    userAgent: req.headers['user-agent'],
    location: inferLocation(clientIp, req),
    action: 'User Signed In',
  });

  res.json({ success: true, message: 'Session logged' });
});