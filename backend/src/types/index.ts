export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Resume types
export interface ParsedResume {
  rawText: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  projects: Project[];
  languages: string[];
  achievements: string[];
  sections: ResumeSection[];
}

export interface WorkExperience {
  jobTitle?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  description?: string;
  bullets: string[];
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
}

export interface Project {
  name?: string;
  description?: string;
  technologies: string[];
  url?: string;
}

export interface ResumeSection {
  name: string;
  content: string;
  order: number;
}

// ATS Scoring types
export interface ATSCheckResult {
  checkId: string;
  category: ATSCategory;
  pointsEarned: number;
  maxPoints: number;
  status: 'pass' | 'warning' | 'fail' | 'unavailable';
  explanation: string;
  severity?: 'high' | 'medium' | 'low';
  recommendation?: string;
  evidence?: string;
}

export type ATSCategory =
  | 'formatting'
  | 'skills'
  | 'experience'
  | 'education'
  | 'contact'
  | 'readability'
  | 'extraction';

export interface ATSScore {
  overall: number;
  maxPossible: number;
  completeness: number;
  band: 'strong' | 'good' | 'fair' | 'needs_improvement';
  bandLabel: string;
  categories: Record<ATSCategory, CategoryScore>;
  checks: ATSCheckResult[];
  findings: ATSFinding[];
  recommendations: string[];
  analysisVersion: string;
}

export interface CategoryScore {
  earned: number;
  max: number;
  percentage: number;
  label: string;
}

export interface ATSFinding {
  id: string;
  priority: 'high' | 'medium' | 'low' | 'positive';
  category: ATSCategory;
  title: string;
  description: string;
  location?: string;
  recommendation?: string;
  evidence?: string;
}

// Job types
export interface JobListing {
  id: string;
  providerName: string;
  externalJobId: string;
  title: string;
  company: string;
  location: string;
  country: string;
  employmentType?: string;
  workplaceType?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements?: string;
  educationRequirements?: string;
  salaryInformation?: string;
  postingDate?: string;
  closingDate?: string;
  lastVerifiedAt?: string;
  sourceStatus: 'verified' | 'unverified' | 'stale' | 'demo';
  applicationUrl: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatch {
  id: string;
  jobListing: JobListing;
  matchScore: number;
  matchedSkills: string[];
  missingRequirements: string[];
  explanations: string[];
  scoreBreakdown: JobMatchBreakdown;
}

export interface JobMatchBreakdown {
  requiredSkills: number;
  experience: number;
  responsibilities: number;
  education: number;
  preferredSkills: number;
}

// Application tracking
export type ApplicationStatus =
  | 'interested'
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  userId: string;
  jobListingId: string;
  jobListing?: JobListing;
  resumeId?: string;
  status: ApplicationStatus;
  appliedAt?: string;
  notes?: string;
  followUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

// User profile
export interface UserProfile {
  id: string;
  fullName?: string;
  country?: string;
  preferredLocations: string[];
  preferredJobTitles: string[];
  experienceLevel?: string;
  employmentPreferences: string[];
  remotePreference?: string;
  preferredIndustries: string[];
  salaryRange?: { min?: number; max?: number; currency?: string };
  createdAt: string;
  updatedAt: string;
}
