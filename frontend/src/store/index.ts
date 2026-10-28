import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────
// Auth store (Supabase Authentication)
// ─────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, name?: string, id?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, name, id = '') =>
        set({
          user: {
            id,
            email,
            name: name || email.split('@')[0],
          },
        }),
      logout: () => {
        try {
          localStorage.removeItem('sb-token');
        } catch {}
        set({ user: null });
      },
    }),
    { name: 'auth-store' }
  )
);

// ─────────────────────────────────────────
// Resume store
// ─────────────────────────────────────────
interface Resume {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  createdAt: string;
  nameDetected?: string;
  parsedContent?: Record<string, unknown>;
}

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  setResumes: (r: Resume[]) => void;
  addResume: (r: Resume) => void;
  removeResume: (id: string) => void;
  setActiveResume: (id: string | null) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumes: [],
      activeResumeId: null,
      setResumes: (resumes) => set({ resumes }),
      addResume: (r) => set((s) => ({ resumes: [r, ...s.resumes] })),
      removeResume: (id) => set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id) })),
      setActiveResume: (id) => set({ activeResumeId: id }),
    }),
    { name: 'resume-store' }
  )
);

// ─────────────────────────────────────────
// Analysis store
// ─────────────────────────────────────────
interface AnalysisSummary {
  id: string;
  resumeId: string;
  overallScore: number;
  band: string;
  bandLabel: string;
  targetJobTitle?: string;
  createdAt: string;
}

interface AnalysisState {
  analyses: AnalysisSummary[];
  latestAnalysisId: string | null;
  setAnalyses: (a: AnalysisSummary[]) => void;
  addAnalysis: (a: AnalysisSummary) => void;
  setLatestAnalysis: (id: string | null) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      analyses: [],
      latestAnalysisId: null,
      setAnalyses: (analyses) => set({ analyses }),
      addAnalysis: (a) => set((s) => ({ analyses: [a, ...s.analyses] })),
      setLatestAnalysis: (id) => set({ latestAnalysisId: id }),
    }),
    { name: 'analysis-store' }
  )
);

export { useThemeStore } from './theme';
export type { Theme, ThemeMode } from './theme';
