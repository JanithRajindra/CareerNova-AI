import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { getSavedJobs, unsaveJob, createApplication } from '@/lib/api';
import {
  Bookmark, BookmarkX, MapPin, DollarSign, Clock, ExternalLink,
  Briefcase, Send, CheckCircle2, FileSearch
} from 'lucide-react';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  matchScore: number;
  savedAt: string;
  description: string;
}

const SAMPLE_SAVED_JOBS: SavedJob[] = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer (React / Node.js)',
    company: 'Stripe Ecosystem Partner',
    location: 'Remote (US/EU/Global)',
    employmentType: 'Full-time',
    salaryMin: 140000,
    salaryMax: 175000,
    currency: 'USD',
    matchScore: 94,
    savedAt: 'Yesterday',
    description: 'We are seeking an experienced Full Stack Engineer to lead our developer platform team. Build high-reliability payment dashboard experiences, design scalable microservices.',
  },
  {
    id: 'job-2',
    title: 'Lead Frontend Architect',
    company: 'Vercel Partner Studio',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'Full-time',
    salaryMin: 165000,
    salaryMax: 210000,
    currency: 'USD',
    matchScore: 89,
    savedAt: '3 days ago',
    description: 'Lead the frontend architecture for our high-scale enterprise client web applications. Drive design systems, web vitals optimization, and mentor engineers across agile squads.',
  },
];

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(SAMPLE_SAVED_JOBS);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getSavedJobs();
        if (res.data?.length) {
          setSavedJobs(res.data);
        }
      } catch {
        // fallback to sample saved jobs
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRemove(id: string) {
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await unsaveJob(id);
    } catch {
      // optimistic update maintained
    }
  }

  async function handleApply(job: SavedJob) {
    try {
      await createApplication({
        jobListingId: job.id,
        status: 'applied',
        notes: `Applied for bookmarked job: ${job.title} at ${job.company}`,
      });
    } catch {}
    setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
  }

  function handleOpenMatcher(job: SavedJob) {
    sessionStorage.setItem('matcher_prefill_job', JSON.stringify({
      title: job.title,
      company: job.company,
      description: job.description,
    }));
    navigate('/matcher');
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Saved Jobs & Bookmarks"
          description="Track positions you're interested in and customize your CV before applying."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="gap-2"
            >
              <Briefcase size={14} />
              Explore Recommendations
            </Button>
          }
        />

        {savedJobs.length === 0 ? (
          <EmptyState
            title="No Saved Jobs Yet"
            description="Browse job recommendations and click the bookmark icon to save roles here."
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => {
              const isApplied = appliedJobs[job.id];

              return (
                <Card
                  key={job.id}
                  className="p-6 hover:shadow-md transition-all border-gray-200"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-800">{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {job.location}
                            </span>
                            <span>•</span>
                            <span>Saved {job.savedAt}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                          {job.employmentType}
                        </span>
                        {job.salaryMin && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <DollarSign size={13} />
                            ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax! / 1000).toFixed(0)}k {job.currency}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-center px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          ATS Fit
                        </span>
                        <span className="text-xl font-extrabold text-blue-600">
                          {job.matchScore}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(job.id)}
                          className="text-gray-400 hover:text-red-600 p-2"
                          title="Remove bookmark"
                        >
                          <BookmarkX size={18} />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenMatcher(job)}
                          className="gap-1.5 text-xs"
                        >
                          <FileSearch size={14} className="text-blue-600" />
                          Compare CV
                        </Button>

                        <Button
                          variant={isApplied ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleApply(job)}
                          className={`gap-1.5 text-xs ${
                            isApplied ? 'text-green-700 border-green-300 bg-green-50' : ''
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 size={13} /> Tracked
                            </>
                          ) : (
                            <>
                              <Send size={13} /> Apply & Track
                            </>
                          )}
                        </Button>
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
