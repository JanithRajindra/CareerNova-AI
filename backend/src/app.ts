import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { resumeRouter } from './routes/resumes';
import { analysisRouter } from './routes/analyses';
import { jobsRouter } from './routes/jobs';
import { applicationsRouter } from './routes/applications';
import { profileRouter } from './routes/profile';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { aiRouter } from './routes/ai';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging (avoid logging request bodies that may contain CV content)
app.use(morgan('combined'));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'CareerMatch AI Backend API',
    status: 'online',
    version: '1.0.0',
    message: 'Welcome to CareerMatch AI API. Use /api/v1 for API endpoints.',
    documentation: '/api/v1',
    health: '/health',
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api/v1', (_req, res) => {
  res.json({
    name: 'CareerMatch AI API',
    version: '1.0.0',
    endpoints: [
      '/api/v1/profile',
      '/api/v1/resumes',
      '/api/v1/analyses',
      '/api/v1/jobs',
      '/api/v1/applications',
    ],
  });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/resumes', resumeRouter);
app.use('/api/v1/analyses', analysisRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/applications', applicationsRouter);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
