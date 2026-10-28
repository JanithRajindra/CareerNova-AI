import axios from 'axios';
import { appCache } from './cache';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response normaliser
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ────────────────────────────────────────────────
// Resume endpoints
// ────────────────────────────────────────────────
export async function uploadResume(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/resumes', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data;
}

export async function listResumes() {
  const res = await api.get('/resumes');
  return res.data;
}

export async function getResume(id: string) {
  const res = await api.get(`/resumes/${id}`);
  return res.data;
}

export async function deleteResume(id: string) {
  const res = await api.delete(`/resumes/${id}`);
  return res.data;
}

export async function exportResume(id: string, format: 'pdf' | 'docx' = 'pdf', tailoredContent?: Record<string, unknown>) {
  const res = await api.post(`/resumes/${id}/export`, { format, tailoredContent }, { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Resume_ATS_Optimized.${format}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────
// Analysis endpoints
// ────────────────────────────────────────────────
export async function analyzeResume(resumeId: string, opts?: { targetJobDescription?: string; targetJobTitle?: string }) {
  const res = await api.post(`/resumes/${resumeId}/analyze`, opts || {});
  return res.data;
}

export async function listAnalyses() {
  const res = await api.get('/analyses');
  return res.data;
}

export async function getAnalysis(id: string) {
  const res = await api.get(`/analyses/${id}`);
  return res.data;
}

export async function generateSuggestions(analysisId: string) {
  const res = await api.post(`/analyses/${analysisId}/suggestions`);
  return res.data;
}

export async function updateSuggestion(id: string, status: 'accepted' | 'rejected' | 'pending') {
  const res = await api.patch(`/analyses/suggestions/${id}`, { status });
  return res.data;
}

export async function analyzeJobDescription(resumeId: string, jobDescription: string) {
  const res = await api.post('/analyses/job-matches/analyze-description', { resumeId, jobDescription });
  return res.data;
}

// ────────────────────────────────────────────────
// Job endpoints
// ────────────────────────────────────────────────
export async function listJobs(params?: Record<string, string>) {
  const cacheKey = `jobs_${JSON.stringify(params || {})}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  const res = await api.get('/jobs', { params });
  appCache.set(cacheKey, res.data, 5 * 60 * 1000); // 5 min TTL
  return res.data;
}

export async function getJob(id: string) {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
}

export async function getRecommendations(resumeId: string, params?: number | Record<string, string | number>) {
  const queryParams = typeof params === 'object' ? { resumeId, ...params } : { resumeId, ...(params !== undefined ? { minMatch: params } : {}) };
  const cacheKey = `recommendations_${JSON.stringify(queryParams)}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  const res = await api.get('/jobs/recommendations', { params: queryParams });
  appCache.set(cacheKey, res.data, 2 * 60 * 1000);
  return res.data;
}

export async function saveJob(id: string) {
  const res = await api.post(`/jobs/${id}/save`);
  appCache.clear();
  return res.data;
}

export async function unsaveJob(id: string) {
  const res = await api.delete(`/jobs/${id}/save`);
  appCache.clear();
  return res.data;
}

export async function getSavedJobs() {
  const res = await api.get('/jobs/user/saved');
  return res.data;
}

// ────────────────────────────────────────────────
// Application tracking endpoints
// ────────────────────────────────────────────────
export async function listApplications(status?: string) {
  const res = await api.get('/applications', { params: status ? { status } : {} });
  return res.data;
}

export async function createApplication(data: {
  jobListingId: string;
  resumeId?: string;
  status?: string;
  notes?: string;
  followUpAt?: string;
}) {
  const res = await api.post('/applications', data);
  return res.data;
}

export async function updateApplication(id: string, data: Partial<{ status: string; notes: string; followUpAt: string }>) {
  const res = await api.patch(`/applications/${id}`, data);
  return res.data;
}

export async function deleteApplication(id: string) {
  const res = await api.delete(`/applications/${id}`);
  return res.data;
}

// ────────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────────
export async function getProfile() {
  const res = await api.get('/profile');
  return res.data;
}

export async function updateProfile(data: Record<string, unknown>) {
  const res = await api.patch('/profile', data);
  return res.data;
}

export async function deleteAccount() {
  const res = await api.delete('/profile/account');
  return res.data;
}

// ────────────────────────────────────────────────
// AI Engine Configuration & Status
// ────────────────────────────────────────────────
export async function getAIStatus() {
  const res = await api.get('/ai/status');
  return res.data;
}

export async function testAIConnection(data?: { apiKey?: string; model?: string; provider?: string }) {
  const res = await api.post('/ai/test', data || {});
  return res.data;
}

// Health check
export async function healthCheck() {
  const res = await api.get('/../../health');
  return res.data;
}

// ────────────────────────────────────────────────
// Administrator
// ────────────────────────────────────────────────
export async function getAdminStats() {
  const res = await api.get('/admin/stats');
  return res.data;
}

export async function recordSessionLogin() {
  try {
    const res = await api.post('/auth/session', {});
    return res.data;
  } catch {
    return null;
  }
}
