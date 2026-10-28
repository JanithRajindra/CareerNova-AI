import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';
import { parseResumeText } from '../services/resumeParserService';
import { calculateATSScore } from '../services/atsScoringService';
import { generatePdf, generateDocx } from '../services/resumeExportService';
import {
  uploadResumeToStorage,
  dbSaveResume,
  dbGetUserResumes,
  dbGetResumeById,
  dbDeleteResume,
  deleteResumeFromStorage,
  getSignedResumeUrl,
  dbSaveAnalysis,
} from '../services/supabaseService';
import { ApiResponse, ParsedResume } from '../types';

// In-memory store (replaced by DB in full deployment)
export const resumeStore: Map<string, ResumeRecord> = new Map();

export interface ResumeRecord {
  id: string;
  userId: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  parsedContent: ParsedResume;
  processingStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}. Please upload a PDF or DOCX file.`, 400));
    }
  },
});

async function extractTextFromBuffer(buffer: Buffer, mimetype: string, originalName: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    try {
      const pdfParseModule: any = await import('pdf-parse');
      let text = '';
      if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        text = res?.text || (typeof res === 'string' ? res : '');
      } else if (typeof pdfParseModule === 'function') {
        const data = await pdfParseModule(buffer);
        text = data.text || '';
      } else if (typeof pdfParseModule.default === 'function') {
        const data = await pdfParseModule.default(buffer);
        text = data.text || '';
      }
      if (!text || text.trim().length < 10) {
        return `[PDF content extracted from ${originalName}. Text extracted: ${text?.trim() || 'none'}]`;
      }
      return text;
    } catch (err: any) {
      console.error('PDF parsing error, attempting string extraction:', err?.message);
      const latin = buffer.toString('latin1').replace(/[^\x20-\x7E\n]/g, ' ');
      const words = latin.split(/\s+/).filter((w) => w.length > 2 && /^[a-zA-Z0-9#+.-]+$/.test(w));
      if (words.length > 20) {
        return words.join(' ');
      }
      throw new AppError('Failed to parse PDF. The file may be corrupted or password-protected.', 422);
    }
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (err) {
      throw new AppError('Failed to parse DOCX file. The file may be corrupted.', 422);
    }
  }
  throw new AppError('Unsupported file format', 400);
}

export const resumeRouter = Router();

// POST /api/v1/resumes — Upload and parse a resume
resumeRouter.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded. Please attach a PDF or DOCX file.', 400);
      }

      const { buffer, mimetype, originalname, size } = req.file;

      // Basic magic byte validation
      if (mimetype === 'application/pdf') {
        const header = buffer.slice(0, 4).toString('ascii');
        if (!header.startsWith('%PDF')) {
          throw new AppError('The uploaded file does not appear to be a valid PDF.', 400);
        }
      }

      const extractedText = await extractTextFromBuffer(buffer, mimetype, originalname);
      const parsedContent = parseResumeText(extractedText);
      const resumeId = uuidv4();

      // Upload to private Supabase Storage if configured
      const storagePath = await uploadResumeToStorage(
        req.userId!,
        resumeId,
        originalname,
        buffer,
        mimetype
      );

      const record: ResumeRecord = {
        id: resumeId,
        userId: req.userId!,
        originalFilename: path.basename(originalname),
        fileType: mimetype,
        fileSize: size,
        extractedText,
        parsedContent,
        processingStatus: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      resumeStore.set(record.id, record);

      // Persist to Supabase PostgreSQL table
      await dbSaveResume({
        id: record.id,
        userId: record.userId,
        originalFilename: record.originalFilename,
        storagePath,
        fileType: record.fileType,
        fileSize: record.fileSize,
        extractedText,
        parsedContent,
      });

      res.status(201).json({
        success: true,
        data: {
          id: record.id,
          originalFilename: record.originalFilename,
          fileType: record.fileType,
          fileSize: record.fileSize,
          storagePath: storagePath || undefined,
          processingStatus: record.processingStatus,
          extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
          parsedContent: record.parsedContent,
          createdAt: record.createdAt,
        },
        message: 'Resume uploaded and parsed successfully',
      } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/resumes — List user's resumes
resumeRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  // Query Supabase DB first if configured, fallback to in-memory store
  const dbResumes = await dbGetUserResumes(req.userId!);
  if (dbResumes && dbResumes.length > 0) {
    return res.json({ success: true, data: dbResumes } as ApiResponse);
  }

  const userResumes = Array.from(resumeStore.values())
    .filter((r) => r.userId === req.userId)
    .map((r) => ({
      id: r.id,
      originalFilename: r.originalFilename,
      fileType: r.fileType,
      fileSize: r.fileSize,
      processingStatus: r.processingStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      nameDetected: r.parsedContent.fullName,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: userResumes } as ApiResponse);
});

// GET /api/v1/resumes/:id — Get a specific resume
resumeRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    let record: any = resumeStore.get(id);

    if (!record) {
      record = await dbGetResumeById(id, req.userId!);
    }

    if (!record) throw new AppError('Resume not found', 404);
    if (record.userId !== req.userId) throw new AppError('Access denied', 403);

    // If file stored in Supabase storage, provide signed download URL
    let downloadUrl = undefined;
    if (record.storagePath) {
      downloadUrl = await getSignedResumeUrl(record.storagePath);
    }

    res.json({
      success: true,
      data: {
        id: record.id,
        originalFilename: record.originalFilename,
        fileType: record.fileType,
        fileSize: record.fileSize,
        parsedContent: record.parsedContent,
        processingStatus: record.processingStatus,
        downloadUrl,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/resumes/:id/analyze — Analyze resume
resumeRouter.post('/:id/analyze', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    let record: any = resumeStore.get(id);
    if (!record) {
      record = await dbGetResumeById(id, req.userId!);
    }
    if (!record) throw new AppError('Resume not found', 404);
    if (record.userId !== req.userId) throw new AppError('Access denied', 403);

    const { targetJobDescription, targetJobTitle } = req.body as {
      targetJobDescription?: string;
      targetJobTitle?: string;
    };

    const score = calculateATSScore({
      parsed: record.parsedContent,
      targetJobDescription,
      targetJobTitle,
    });

    const analysisId = uuidv4();

    await dbSaveAnalysis({
      id: analysisId,
      userId: record.userId,
      resumeId: record.id,
      score,
      targetJobTitle,
      targetJobDescription,
    });

    res.status(201).json({
      success: true,
      data: {
        id: analysisId,
        resumeId: record.id,
        score,
        targetJobTitle,
        hasTargetJob: !!targetJobDescription,
        createdAt: new Date().toISOString(),
      },
      message: 'ATS analysis completed successfully',
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/resumes/:id/export — Export resume as ATS-friendly PDF or DOCX
resumeRouter.post('/:id/export', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    const record = resumeStore.get(id);
    if (!record) throw new AppError('Resume not found', 404);
    if (record.userId !== req.userId) throw new AppError('Access denied', 403);

    const { format = 'pdf', tailoredContent } = req.body as {
      format?: 'pdf' | 'docx';
      tailoredContent?: Partial<ParsedResume>;
    };

    // Merge any tailored content with base parsed content
    const resumeToExport: ParsedResume = {
      ...record.parsedContent,
      ...(tailoredContent || {}),
    };

    const baseName = (resumeToExport.fullName || record.originalFilename.replace(/\.[^/.]+$/, ''))
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'docx') {
      const buffer = await generateDocx(resumeToExport);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_ATS_Optimized.docx"`);
      res.send(buffer);
    } else {
      const buffer = await generatePdf(resumeToExport);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_ATS_Optimized.pdf"`);
      res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/resumes/:id
resumeRouter.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params['id'] as string;
    let record: any = resumeStore.get(id);
    if (!record) {
      record = await dbGetResumeById(id, req.userId!);
    }

    if (!record) throw new AppError('Resume not found', 404);
    if (record.userId !== req.userId) throw new AppError('Access denied', 403);

    if (record.storagePath) {
      await deleteResumeFromStorage(record.storagePath);
    }
    await dbDeleteResume(id, req.userId!);
    resumeStore.delete(id);

    res.json({ success: true, message: 'Resume deleted successfully' } as ApiResponse);
  } catch (err) {
    next(err);
  }
});
