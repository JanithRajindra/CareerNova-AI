import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { useResumeStore } from '@/store';
import {
  listJobs,
  getRecommendations,
  saveJob,
  unsaveJob,
  createApplication,
  listResumes,
  listApplications,
} from '@/lib/api';
import {
  Briefcase, MapPin, DollarSign, Clock, Bookmark, BookmarkCheck,
  Search, Sparkles, Filter, ChevronRight, CheckCircle2, AlertCircle,
  ExternalLink, Building2, Send, RotateCcw, FileText, Check, ShieldCheck,
  GraduationCap, Layers, ArrowUpRight, HelpCircle, Globe, ChevronDown, ChevronUp
} from 'lucide-react';

interface JobListingItem {
  id: string;
  title: string;
  company: string;
  location: string;
  category?: string;
  employmentType: string;
  workplaceType?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryInformation?: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceLevel: string;
  description: string;
  postedAt: string;
  isSaved?: boolean;
  providerName?: string;
  country?: string;
  applicationUrl?: string;
  sourceStatus?: string;
  isEstimate?: boolean;
  explanations?: string[];
  scoreBreakdown?: {
    requiredSkills: number;
    experience: number;
    responsibilities: number;
    education: number;
    preferredSkills: number;
  };
  aiInsights?: {
    rationale?: string;
    keyStrengths?: string[];
    tailoringTip?: string;
    model?: string;
    isAIGenerated?: boolean;
  };
  isAIGenerated?: boolean;
  aiModel?: string;
}

const INDUSTRY_CATEGORIES = [
  'All Industries',
  'Accounting, Finance, and Banking',
  'Agriculture and Agribusiness',
  'Business Management and Administration',
  'Marketing, Sales, and Customer Service',
  'Human Resources',
  'Engineering and Manufacturing',
  'Healthcare and Life Sciences',
  'Logistics and Supply Chain',
  'Hospitality and Tourism',
  'Software Engineering and IT',
  'Education and Research',
  'Construction and Skilled Trades',
  'Design, Media, and Communications',
  'Government and Public Sector',
  'Internships, Graduate Trainee Programs, and Entry-Level Jobs',
];

const LOCATIONS = [
  'All Locations',
  'Colombo',
  'Kandy',
  'Galle',
  'Gampaha',
  'Kurunegala',
  'Trincomalee',
  'Remote (Sri Lanka)',
];

interface SriLankanJobSite {
  id: number;
  name: string;
  priority?: string;
  badge?: string;
  category: string;
  description: string;
  url: string;
  linkText: string;
  initials: string;
  theme: {
    iconBg: string;
    accentBadge: string;
  };
}

const TOP_SRI_LANKAN_JOB_SITES: SriLankanJobSite[] = [
  {
    id: 1,
    name: 'TopJobs.lk',
    priority: 'Priority 1',
    category: 'General and professional careers',
    description: 'Covers corporate, executive, technical, administrative and other vacancies.',
    url: 'https://www.topjobs.lk/?utm_source=chatgpt.com',
    linkText: 'Visit TopJobs.lk',
    initials: 'TJ',
    theme: {
      iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
      accentBadge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
  },
  {
    id: 2,
    name: 'XpressJobs',
    priority: 'Priority 1',
    badge: 'Peak Lanka+1',
    category: 'Multiple industries and career levels',
    description: 'Useful for a broad range of local job opportunities.',
    url: 'https://xpress.jobs/?utm_source=chatgpt.com',
    linkText: 'Visit XpressJobs',
    initials: 'XJ',
    theme: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
      accentBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
  },
  {
    id: 3,
    name: 'LinkedIn Jobs',
    badge: 'LinkedIn',
    category: 'Professional, international and remote jobs',
    description: 'Covers many industries, internships and international employers.',
    url: 'https://www.linkedin.com/jobs/?utm_source=chatgpt.com',
    linkText: 'Visit LinkedIn Jobs',
    initials: 'in',
    theme: {
      iconBg: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
      accentBadge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    },
  },
  {
    id: 4,
    name: 'ikmanJOBS',
    badge: 'ikmanJOBS',
    category: 'Entry-level, service and general jobs',
    description: 'Includes sales, administration, hospitality, finance, IT, internships and more.',
    url: 'https://ikman.lk/en/jobs?utm_source=chatgpt.com',
    linkText: 'Visit ikmanJOBS',
    initials: 'ik',
    theme: {
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      accentBadge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
  },
  {
    id: 5,
    name: 'Observer JOBS',
    badge: 'Observer JOBS',
    category: 'Private and public-sector opportunities',
    description: 'A useful source for vacancies across Sri Lanka.',
    url: 'https://www.observerjobs.lk/?utm_source=chatgpt.com',
    linkText: 'Visit Observer JOBS',
    initials: 'OJ',
    theme: {
      iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
      accentBadge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    },
  },
  {
    id: 6,
    name: 'DreamJobs.lk',
    badge: 'DreamJobs.lk',
    category: 'Professional and industry-specific vacancies',
    description: 'Consider for roles in areas such as education, marketing, healthcare and IT.',
    url: 'https://www.dreamjobs.lk/?utm_source=chatgpt.com',
    linkText: 'Visit DreamJobs.lk',
    initials: 'DJ',
    theme: {
      iconBg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
      accentBadge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
  },
  {
    id: 7,
    name: 'Jobpal.lk',
    badge: 'Peak Lanka+1',
    category: 'Local jobs and varied employment types',
    description: 'Another potential source for full-time, part-time, internship and other vacancies.',
    url: 'https://jobpal.lk/?utm_source=chatgpt.com',
    linkText: 'Visit Jobpal.lk',
    initials: 'JP',
    theme: {
      iconBg: 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300',
      accentBadge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    },
  },
  {
    id: 8,
    name: 'GreatJobs.lk',
    badge: 'greatjobs.lk',
    category: 'Employer listings and job matching',
    description: 'Potentially useful for expanding vacancy coverage and matching candidates to employers.',
    url: 'https://www.greatjobs.lk/?utm_source=chatgpt.com',
    linkText: 'Visit GreatJobs.lk',
    initials: 'GJ',
    theme: {
      iconBg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
      accentBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    },
  },
  {
    id: 9,
    name: 'Career.lk',
    badge: 'career.lk',
    category: 'Jobs across many sectors',
    description: 'Its categories include finance, engineering, healthcare, tourism, IT, sales and education.',
    url: 'https://www.career.lk/?utm_source=chatgpt.com',
    linkText: 'Visit Career.lk',
    initials: 'CR',
    theme: {
      iconBg: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
      accentBadge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    },
  },
  {
    id: 10,
    name: 'ITPro.lk',
    badge: 'Tech Specialist',
    category: 'IT and technology-focused vacancies',
    description: 'A specialist source for software, engineering, IT support and tech internships.',
    url: 'https://www.itpro.lk',
    linkText: 'Visit ITPro.lk',
    initials: 'IT',
    theme: {
      iconBg: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
      accentBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    },
  },
];

export default function JobsPage() {
  const navigate = useNavigate();
  const { resumes, activeResumeId, setResumes, setActiveResume } = useResumeStore();

  const [jobs, setJobs] = useState<JobListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListingItem | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Industries');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [workplaceFilter, setWorkplaceFilter] = useState('all');
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'title' | 'company'>('match');
  const [isSitesExpanded, setIsSitesExpanded] = useState(true);

  // Load existing resumes on mount if empty in store
  useEffect(() => {
    async function initResumes() {
      try {
        const res = await listResumes();
        if (res.data?.length) {
          setResumes(res.data);
          if (!activeResumeId) {
            setActiveResume(res.data[0].id);
          }
        }
      } catch {
        // offline / local fallback
      }
    }
    if (!resumes.length) {
      initResumes();
    }
  }, []);

  // Load tracked applications to flag applied jobs
  useEffect(() => {
    async function loadTracked() {
      try {
        const appRes = await listApplications();
        if (appRes.data?.length) {
          const map: Record<string, boolean> = {};
          appRes.data.forEach((a: any) => {
            if (a.jobListingId) map[a.jobListingId] = true;
          });
          setAppliedJobs((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // ignore
      }
    }
    loadTracked();
  }, []);

  // Fetch jobs or personalized recommendations
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        let loaded: JobListingItem[] = [];

        // 1. If an active resume is available, compute genuine recommendations
        if (activeResumeId) {
          try {
            const recRes = await getRecommendations(activeResumeId);
            if (recRes.data?.length) {
              loaded = recRes.data.map((m: any) => ({
                id: m.jobListing.id,
                title: m.jobListing.title,
                company: m.jobListing.company,
                location: m.jobListing.location,
                category: m.jobListing.category || 'General Careers',
                employmentType: m.jobListing.employmentType || 'Full-time',
                workplaceType: m.jobListing.workplaceType || 'Onsite',
                experienceLevel: m.jobListing.experienceRequirements || 'Mid-Senior',
                description: m.jobListing.description,
                matchScore: m.matchScore,
                matchedSkills: m.matchedSkills || [],
                missingSkills: m.missingRequirements || [],
                postedAt: m.jobListing.postingDate
                  ? new Date(m.jobListing.postingDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent',
                applicationUrl: m.jobListing.applicationUrl,
                sourceStatus: m.jobListing.sourceStatus || 'verified',
                providerName: m.jobListing.providerName,
                salaryInformation: m.jobListing.salaryInformation,
                country: m.jobListing.country,
                isSaved: !!m.isSaved,
                isEstimate: !!m.isEstimate,
                explanations: m.explanations || [],
                scoreBreakdown: m.scoreBreakdown,
                aiInsights: m.aiInsights,
                isAIGenerated: !!m.isAIGenerated,
                aiModel: m.aiModel || recRes.meta?.aiModel,
              }));
            }
          } catch (recErr) {
            console.warn('[JobsPage] Recommendation error, falling back to public browse:', recErr);
          }
        }

        // 2. If no resume was selected or recommendations returned empty, browse all live verified listings
        if (!loaded.length) {
          const res = await listJobs();
          if (res.data?.length) {
            loaded = res.data.map((j: any) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              category: j.category || 'General Careers',
              employmentType: j.employmentType || 'Full-time',
              workplaceType: j.workplaceType || 'Onsite',
              experienceLevel: j.experienceRequirements || 'Not specified',
              description: j.description,
              matchScore: 0, // Unscored without CV
              matchedSkills: j.requiredSkills?.slice(0, 4) || [],
              missingSkills: [],
              postedAt: j.postingDate
                ? new Date(j.postingDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent',
              applicationUrl: j.applicationUrl,
              sourceStatus: j.sourceStatus || 'verified',
              providerName: j.providerName,
              salaryInformation: j.salaryInformation,
              country: j.country,
              isSaved: !!j.isSaved,
              isEstimate: false,
              explanations: [],
            }));
          }
        }

        setJobs(loaded);
      } catch (err) {
        console.error('[JobsPage] Fetch failed:', err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [activeResumeId]);

  // Toggle Save Job
  async function handleToggleSave(job: JobListingItem, e: React.MouseEvent) {
    e.stopPropagation();
    const newSaved = !job.isSaved;
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, isSaved: newSaved } : j))
    );
    try {
      if (newSaved) {
        await saveJob(job.id);
      } else {
        await unsaveJob(job.id);
      }
    } catch {
      // optimistic update retained
    }
  }

  // Safe Job Application Navigation & Tracker Recording
  async function handleApplyAndTrack(job: JobListingItem, e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    // 1. Avoid duplicate application calls if already tracked
    if (!appliedJobs[job.id]) {
      try {
        await createApplication({
          jobListingId: job.id,
          resumeId: activeResumeId || undefined,
          status: 'applied',
          notes: `Applied via CareerMatch AI recommendations for ${job.title} at ${job.company}.`,
        });
        setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
      } catch (err) {
        console.warn('[ApplyAndTrack] Application tracking notice:', err);
        setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
      }
    }

    // 2. Safe navigation to exact verified vacancy or employer careers URL
    const appUrl = job.applicationUrl;
    if (appUrl && (appUrl.startsWith('https://') || appUrl.startsWith('http://'))) {
      window.open(appUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // Open CV Deep Matcher
  function handleOpenMatcher(job: JobListingItem, e: React.MouseEvent) {
    e.stopPropagation();
    sessionStorage.setItem(
      'matcher_prefill_job',
      JSON.stringify({
        title: job.title,
        company: job.company,
        description:
          job.description +
          '\n\nRequired Skills: ' +
          job.matchedSkills.join(', ') +
          (job.missingSkills.length ? '\n\nPreferred / Gap Skills: ' + job.missingSkills.join(', ') : ''),
      })
    );
    navigate('/matcher');
  }

  // Reset all filters
  function handleResetFilters() {
    setSearchQuery('');
    setCategoryFilter('All Industries');
    setLocationFilter('All Locations');
    setWorkplaceFilter('all');
    setEmploymentFilter('all');
    setExperienceFilter('all');
    setPortalFilter('all');
    setMinMatchFilter(0);
    setSortBy('match');
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All Industries' ||
    locationFilter !== 'All Locations' ||
    workplaceFilter !== 'all' ||
    employmentFilter !== 'all' ||
    experienceFilter !== 'all' ||
    portalFilter !== 'all' ||
    minMatchFilter > 0;

  // Filtered and Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Match score threshold (only active if CV exists)
        if (activeResumeId && minMatchFilter > 0 && job.matchScore < minMatchFilter) return false;

        // Category filter
        if (categoryFilter !== 'All Industries') {
          if (!job.category || !job.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
            return false;
          }
        }

        // Location filter
        if (locationFilter !== 'All Locations') {
          if (!job.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
        }

        // Workplace type
        if (workplaceFilter !== 'all') {
          if ((job.workplaceType || '').toLowerCase() !== workplaceFilter.toLowerCase()) return false;
        }

        // Employment type
        if (employmentFilter !== 'all') {
          if (job.employmentType.toLowerCase() !== employmentFilter.toLowerCase()) return false;
        }

        // Experience level
        if (experienceFilter !== 'all') {
          if (!job.experienceLevel.toLowerCase().includes(experienceFilter.toLowerCase())) return false;
        }

        // Portal / Source filter
        if (portalFilter !== 'all') {
          const provider = (job.providerName || '').toLowerCase();
          if (!provider.includes(portalFilter.toLowerCase())) return false;
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchComp = job.company.toLowerCase().includes(q);
          const matchDesc = job.description.toLowerCase().includes(q);
          const matchSkills = [...job.matchedSkills, ...job.missingSkills].some((s) =>
            s.toLowerCase().includes(q)
          );
          if (!matchTitle && !matchComp && !matchDesc && !matchSkills) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        }
        if (sortBy === 'recent') {
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        }
        if (sortBy === 'company') {
          return a.company.localeCompare(b.company);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [
    jobs,
    searchQuery,
    categoryFilter,
    locationFilter,
    workplaceFilter,
    employmentFilter,
    experienceFilter,
    portalFilter,
    minMatchFilter,
    sortBy,
    activeResumeId,
  ]);

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  // Industry badge color mapping
  function getIndustryBadge(category?: string) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('finance') || cat.includes('banking') || cat.includes('accounting')) {
      return { label: 'Banking & Finance', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' };
    }
    if (cat.includes('agri')) {
      return { label: 'Agriculture & Agri', bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800' };
    }
    if (cat.includes('management') || cat.includes('business')) {
      return { label: 'Business & Management', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' };
    }
    if (cat.includes('marketing') || cat.includes('sales')) {
      return { label: 'Marketing & Sales', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' };
    }
    if (cat.includes('human') || cat.includes('hr')) {
      return { label: 'Human Resources', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' };
    }
    if (cat.includes('health') || cat.includes('life')) {
      return { label: 'Healthcare & Sciences', bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' };
    }
    if (cat.includes('logistic') || cat.includes('supply')) {
      return { label: 'Logistics & Supply Chain', bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' };
    }
    if (cat.includes('hospitality') || cat.includes('tour')) {
      return { label: 'Hospitality & Tourism', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' };
    }
    if (cat.includes('construct') || cat.includes('trade')) {
      return { label: 'Construction & Civil', bg: 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/60 dark:text-stone-300 dark:border-stone-700' };
    }
    if (cat.includes('design') || cat.includes('media')) {
      return { label: 'Design & Media', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800' };
    }
    if (cat.includes('intern') || cat.includes('trainee') || cat.includes('entry')) {
      return { label: 'Graduate & Internship', bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800' };
    }
    if (cat.includes('software') || cat.includes('it')) {
      return { label: 'Software & IT', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
    }
    return { label: category || 'Verified Career', bg: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Personalized Job Recommendations"
          description="Discover relevant job opportunities across industries, matched against your CV, skills, experience, education, and career preferences."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/saved')}
              className="gap-2 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Bookmark size={15} className="text-blue-600 dark:text-blue-400" />
              View Saved Jobs ({jobs.filter((j) => j.isSaved).length})
            </Button>
          }
        />

        {/* Active CV Selection & Upload Banner */}
        {activeResume ? (
          <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent dark:from-blue-950/40 dark:via-indigo-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {activeResume.originalFilename}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                    <Check size={11} /> Active Matching Profile
                  </span>
                  {activeResume.nameDetected && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      • {activeResume.nameDetected}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Vacancies below are dynamically ranked and scored against your verified skills and qualifications.
                </p>
              </div>
            </div>

            {/* Resume Switcher if multiple exist */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              {resumes.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">Switch CV:</span>
                  <select
                    value={activeResumeId || ''}
                    onChange={(e) => setActiveResume(e.target.value)}
                    className="text-xs font-semibold rounded-xl border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.originalFilename}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/analyze')}
                className="text-xs gap-1.5 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Sparkles size={13} className="text-blue-500" />
                Upload Another CV
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-transparent dark:from-amber-950/30 dark:via-blue-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  No CV Selected for AI Matching
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                  Upload your CV to calculate exact compatibility percentages, verified skills, and skill gaps for every vacancy. You can also browse all live vacancies below.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/analyze')}
              className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText size={14} />
              Upload CV to Unlock Matching
            </Button>
          </div>
        )}

        {/* Top 10 Sri Lankan Job Sites for CareerMatch AI */}
        <section aria-labelledby="top-sri-lankan-job-sites" className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 id="top-sri-lankan-job-sites" className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Top 10 Sri Lankan job sites for CareerMatch AI
                    </h2>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      Top 10 Directory
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Curated employment directories, professional networks, and industry specialists across Sri Lanka.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSitesExpanded(!isSitesExpanded)}
                  className="text-xs gap-1.5 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {isSitesExpanded ? (
                    <>
                      <span>Hide Sites</span>
                      <ChevronUp size={13} />
                    </>
                  ) : (
                    <>
                      <span>Show All 10 Sites</span>
                      <ChevronDown size={13} />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isSitesExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1">
                {TOP_SRI_LANKAN_JOB_SITES.map((site) => (
                  <div
                    key={site.id}
                    className="bg-gray-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${site.theme.iconBg}`}>
                            {site.initials}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 block leading-none">
                              #{site.id}
                            </span>
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {site.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {site.priority && (
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                              {site.priority}
                            </span>
                          )}
                          {site.badge && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${site.theme.accentBadge}`}>
                              {site.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 leading-snug">
                          {site.category}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {site.description}
                        </p>
                      </div>
                    </div>

                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 transition-colors shadow-2xs"
                    >
                      <span>{site.linkText}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Universal Search & Multi-Industry Filter Controls */}
        <Card className="p-5 shadow-xs border-gray-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by job title, company name, skills, or industry keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
              >
                <option value="match">Sort: Best CV Match</option>
                <option value="recent">Sort: Most Recently Posted</option>
                <option value="company">Sort: Company (A-Z)</option>
                <option value="title">Sort: Job Title (A-Z)</option>
              </select>

              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-1.5 text-xs text-gray-600 dark:text-slate-400 dark:border-slate-700 hover:text-red-600"
                >
                  <RotateCcw size={13} />
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          {/* Filter Pills / Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
            {/* 1. Industry / Category */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                Industry / Field
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                {INDUSTRY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Location */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Workplace Type */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                Workplace Mode
              </label>
              <select
                value={workplaceFilter}
                onChange={(e) => setWorkplaceFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="all">All Modes</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            {/* 4. Experience Level */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                Experience Level
              </label>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="intern">Intern / Trainee</option>
                <option value="entry">Entry-Level (0-2 yrs)</option>
                <option value="mid">Mid-Senior (2-5 yrs)</option>
                <option value="senior">Senior / Lead (5+ yrs)</option>
              </select>
            </div>

            {/* 5. Match Score */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                CV Compatibility
              </label>
              <select
                value={minMatchFilter}
                onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value={0}>All Scores</option>
                <option value={85}>85%+ Top Tier Fit</option>
                <option value={75}>75%+ Strong Fit</option>
                <option value={60}>60%+ Moderate Fit</option>
              </select>
            </div>

            {/* 6. Job Source */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 block mb-1">
                Job Source
              </label>
              <select
                value={portalFilter}
                onChange={(e) => setPortalFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="all">All Verified Sources</option>
                <option value="topjobs">TopJobs.lk</option>
                <option value="expressjobs">XpressJobs.lk</option>
                <option value="linkedin">LinkedIn Sri Lanka</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 px-1">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{filteredJobs.length}</strong> verified opportunities across industries
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-green-600 dark:text-green-400" />
            100% Genuine Employers &amp; Verified Vacancies
          </span>
        </div>

        {/* Job Cards List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <EmptyState
              title="No matching verified vacancies found"
              description="Try broadening your industry, location, or match score filters to explore more opportunities."
              action={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2">
                    <RotateCcw size={14} /> Reset Filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            filteredJobs.map((job) => {
              const isApplied = appliedJobs[job.id];
              const indBadge = getIndustryBadge(job.category);
              const hasUrl = !!job.applicationUrl && job.applicationUrl.startsWith('http');

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 p-6 cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Job Info */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg truncate">
                              {job.title}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${indBadge.bg}`}>
                              {indBadge.label}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                              ● Live Vacancy
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-gray-400" /> {job.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={13} className="text-gray-400" /> Posted {job.postedAt}
                            </span>
                            {job.providerName && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {job.providerName.includes('topjobs') ? 'TopJobs.lk' :
                                   job.providerName.includes('express') ? 'XpressJobs.lk' :
                                   job.providerName.includes('linkedin') ? 'LinkedIn Sri Lanka' :
                                   'Employer Career Portal'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Work Mode & Salary Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium">
                          {job.employmentType}
                        </span>
                        {job.workplaceType && (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium">
                            {job.workplaceType}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium">
                          {job.experienceLevel}
                        </span>
                        {job.salaryInformation && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1">
                            <DollarSign size={13} />
                            {job.salaryInformation}
                          </span>
                        )}
                      </div>

                      {/* Matched vs Missing Skills Badges */}
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        {job.matchedSkills.length > 0 && (
                          <>
                            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">
                              {activeResumeId ? 'Matched:' : 'Skills:'}
                            </span>
                            {job.matchedSkills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200 dark:border-green-800"
                              >
                                <CheckCircle2 size={11} /> {skill}
                              </span>
                            ))}
                            {job.matchedSkills.length > 4 && (
                              <span className="text-xs text-gray-400">+{job.matchedSkills.length - 4} more</span>
                            )}
                          </>
                        )}

                        {activeResumeId && job.missingSkills.length > 0 && (
                          <>
                            <span className="text-xs font-medium text-gray-400 ml-2 mr-1">Gap:</span>
                            {job.missingSkills.slice(0, 2).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800"
                              >
                                <AlertCircle size={10} /> {skill}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      {/* AI Fit Analysis Rationale */}
                      {job.aiInsights?.rationale && (
                        <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent border border-blue-100 dark:border-blue-900/50 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 text-[11px]">
                            <Sparkles size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>AI Fit Analysis:</span>
                          </div>
                          <p className="text-gray-700 dark:text-slate-300 text-[11px] leading-relaxed">
                            {job.aiInsights.rationale}
                          </p>
                          {job.aiInsights.tailoringTip && (
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold pt-0.5">
                              💡 <strong>Application Tip:</strong> {job.aiInsights.tailoringTip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right side: Match score & Actions */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-800 w-full lg:w-auto justify-between lg:justify-end">
                      {/* Match Score Gauge */}
                      {activeResumeId ? (
                        <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 min-w-[80px]">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                            {job.isEstimate ? 'Estimate' : 'CV Match'}
                          </span>
                          <span
                            className={`text-2xl font-extrabold ${
                              job.matchScore >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : job.matchScore >= 65
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {job.matchScore}%
                          </span>
                        </div>
                      ) : (
                        <div className="text-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-xs">
                          <span className="block font-semibold">Unscored</span>
                          <span className="text-[10px]">Upload CV</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSave(job, e)}
                          title={job.isSaved ? 'Remove from saved jobs' : 'Save job to bookmarks'}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            job.isSaved
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                              : 'border-gray-200 dark:border-slate-700 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {job.isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenMatcher(job, e)}
                          className="gap-1.5 text-xs hidden sm:inline-flex dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
                          Compare CV
                        </Button>

                        {/* Apply on Employer Site & Track Button */}
                        {hasUrl ? (
                          <Button
                            variant={isApplied ? 'outline' : 'primary'}
                            size="sm"
                            onClick={(e) => handleApplyAndTrack(job, e)}
                            className={`gap-1.5 text-xs ${
                              isApplied
                                ? 'text-green-700 dark:text-green-300 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/50'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 size={13} />
                                Tracked (Applied)
                              </>
                            ) : (
                              <>
                                <ExternalLink size={13} />
                                Apply on Site &amp; Track
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="gap-1.5 text-xs text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-800 cursor-not-allowed"
                            title="Application link not provided by source"
                          >
                            Application link unavailable
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Job Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getIndustryBadge(selectedJob.category).bg}`}>
                      {getIndustryBadge(selectedJob.category).label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedJob.company}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {selectedJob.location} • {selectedJob.employmentType} • {selectedJob.workplaceType || 'Onsite'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Match Overview Verdict */}
              {activeResumeId ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                      Compatibility Verdict
                    </span>
                    <p className="text-sm text-gray-800 dark:text-slate-200">
                      Your CV is a <strong className="text-blue-900 dark:text-blue-300">{selectedJob.matchScore}% match</strong> for this position.
                    </p>
                    {selectedJob.explanations?.[0] && (
                      <p className="text-xs text-gray-600 dark:text-slate-400 pt-0.5">
                        {selectedJob.explanations[0]}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                      {selectedJob.matchScore}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                      Standard Vacancy Overview
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Upload your CV to see personalized score breakdowns and verified skills matching.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/analyze')} className="text-xs">
                    Upload CV
                  </Button>
                </div>
              )}

              {/* Skills Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Skills Matching Breakdown
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-600 dark:text-slate-300 font-medium block mb-1.5">
                      Required Skills &amp; Competencies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200 dark:border-green-800 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedJob.missingSkills.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block mb-1.5">
                        Identified Skill Gaps (Consider highlighting if experienced):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 flex items-center gap-1"
                          >
                            <AlertCircle size={12} /> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Role Overview &amp; Responsibilities
                </h4>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-xs text-gray-700 dark:text-slate-300 leading-relaxed space-y-2">
                  <p>{selectedJob.description}</p>
                  {selectedJob.salaryInformation && (
                    <p className="pt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                      Compensation Benchmark: {selectedJob.salaryInformation}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => handleToggleSave(selectedJob, { stopPropagation: () => {} } as any)}
                  className="gap-2 dark:border-slate-700"
                >
                  {selectedJob.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {selectedJob.isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks'}
                </Button>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={(e) => handleOpenMatcher(selectedJob, e)}
                    className="gap-1.5 dark:border-slate-700"
                  >
                    <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                    Deep Matcher
                  </Button>

                  {selectedJob.applicationUrl && selectedJob.applicationUrl.startsWith('http') ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleApplyAndTrack(selectedJob);
                        setSelectedJob(null);
                      }}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink size={14} />
                      Apply on Employer Site &amp; Track
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="text-xs text-gray-400 cursor-not-allowed">
                      Application link unavailable
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
