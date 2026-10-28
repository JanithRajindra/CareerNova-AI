import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { getSavedJobs, unsaveJob, createApplication, listApplications } from '@/lib/api';
import { useResumeStore } from '@/store';
import {
  Bookmark, BookmarkX, MapPin, DollarSign, Clock, ExternalLink,
  Briefcase, Send, CheckCircle2, FileSearch, Filter, Sparkles
} from 'lucide-react';

interface SavedJobItem {
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
  matchScore?: number;
  savedAt?: string;
  description: string;
  applicationUrl?: string;
  providerName?: string;
}

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const { activeResumeId } = useResumeStore();

  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getSavedJobs();
        if (res.data) {
          setSavedJobs(res.data);
        }
      } catch (err) {
        console.warn('[SavedJobsPage] Load warning:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load tracked applications
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

  async function handleRemove(id: string) {
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await unsaveJob(id);
    } catch {
      // optimistic update maintained
    }
  }

  async function handleApply(job: SavedJobItem) {
    try {
      await createApplication({
        jobListingId: job.id,
        resumeId: activeResumeId || undefined,
        status: 'applied',
        notes: `Applied for bookmarked job: ${job.title} at ${job.company}`,
      });
    } catch {}
    setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));

    // Safe navigation to original vacancy URL
    if (job.applicationUrl && job.applicationUrl.startsWith('http')) {
      window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleOpenMatcher(job: SavedJobItem) {
    sessionStorage.setItem(
      'matcher_prefill_job',
      JSON.stringify({
        title: job.title,
        company: job.company,
        description: job.description,
      })
    );
    navigate('/matcher');
  }

  // Available categories in saved jobs
  const categories = useMemo(() => {
    const set = new Set<string>();
    savedJobs.forEach((j) => {
      if (j.category) set.add(j.category);
    });
    return Array.from(set);
  }, [savedJobs]);

  const filteredSavedJobs = useMemo(() => {
    return savedJobs.filter((job) => {
      if (categoryFilter !== 'all' && job.category !== categoryFilter) return false;
      if (minMatchFilter > 0 && (job.matchScore || 0) < minMatchFilter) return false;
      return true;
    });
  }, [savedJobs, categoryFilter, minMatchFilter]);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Saved Jobs & Bookmarks"
          description="Review your bookmarked opportunities across industries, compare against your CV, and track your applications."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Briefcase size={14} />
              Explore Recommendations
            </Button>
          }
        />

        {/* Filter Toolbar if saved jobs exist */}
        {savedJobs.length > 0 && (
          <Card className="p-4 shadow-xs border-gray-200 dark:border-slate-800 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="font-bold text-gray-700 dark:text-slate-300">Filter Saved Jobs:</span>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value="all">All Industries ({savedJobs.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={minMatchFilter}
                onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                className="rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1.5 outline-none focus:border-blue-500"
              >
                <option value={0}>All Match Scores</option>
                <option value={80}>80%+ Fit</option>
                <option value={65}>65%+ Fit</option>
              </select>
            </div>

            <span className="text-gray-500 dark:text-slate-400">
              Showing {filteredSavedJobs.length} of {savedJobs.length} bookmarked roles
            </span>
          </Card>
        )}

        {savedJobs.length === 0 ? (
          <EmptyState
            title="No Saved Jobs Yet"
            description="Explore personalized job recommendations and click the bookmark icon on any vacancy to save it here for tracking."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Recommendations
              </Button>
            }
          />
        ) : filteredSavedJobs.length === 0 ? (
          <EmptyState
            title="No Saved Jobs Match Filters"
            description="Try selecting 'All Industries' or lowering your match threshold."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setMinMatchFilter(0);
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredSavedJobs.map((job) => {
              const isApplied = appliedJobs[job.id];
              const hasUrl = !!job.applicationUrl && job.applicationUrl.startsWith('http');

              return (
                <Card
                  key={job.id}
                  className="p-6 hover:shadow-md transition-all border-gray-200 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                              {job.title}
                            </h3>
                            {job.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {job.category}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {job.location}
                            </span>
                            <span>•</span>
                            <span>{job.employmentType}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 mt-1">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {job.salaryInformation && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1">
                            <DollarSign size={13} />
                            {job.salaryInformation}
                          </span>
                        )}
                        {job.providerName && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                            Source: {job.providerName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-800 w-full lg:w-auto justify-between lg:justify-end">
                      {job.matchScore !== undefined && job.matchScore > 0 ? (
                        <div className="text-center px-4 py-2 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 min-w-[70px]">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                            CV Fit
                          </span>
                          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                            {job.matchScore}%
                          </span>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(job.id)}
                          className="text-gray-400 hover:text-red-600 p-2 dark:hover:bg-slate-800"
                          title="Remove bookmark"
                        >
                          <BookmarkX size={18} />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenMatcher(job)}
                          className="gap-1.5 text-xs dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <FileSearch size={14} className="text-blue-600 dark:text-blue-400" />
                          Compare CV
                        </Button>

                        {hasUrl ? (
                          <Button
                            variant={isApplied ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleApply(job)}
                            className={`gap-1.5 text-xs ${
                              isApplied
                                ? 'text-green-700 dark:text-green-300 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 size={13} /> Tracked (Applied)
                              </>
                            ) : (
                              <>
                                <ExternalLink size={13} /> Apply &amp; Track
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled className="text-xs text-gray-400 cursor-not-allowed">
                            Link unavailable
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
