import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables once from the verified .env file path
const candidatePaths = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o', // Flagship Best AI Model for Maximum Accuracy & Reasoning
    provider: process.env.AI_PROVIDER || 'openai',
    baseURL: process.env.AI_BASE_URL || '',
  },
  jobProvider: {
    apiKey: process.env.JOB_PROVIDER_API_KEY || '',
    name: process.env.JOB_PROVIDER_NAME || 'topjobs',
    adzunaAppId: process.env.ADZUNA_APP_ID || '',
    adzunaApiKey: process.env.ADZUNA_API_KEY || '',
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET || 'resumes',
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    uploadMaxRequests: 10,
  },
  isDemoMode: false,
};

export default config;
