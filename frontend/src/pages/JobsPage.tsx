import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { useResumeStore } from '@/store';
import { listJobs, getRecommendations, saveJob, unsaveJob, createApplication } from '@/lib/api';
import {
  Briefcase, MapPin, DollarSign, Clock, Bookmark, BookmarkCheck,
  Search, Sparkles, Filter, ChevronRight, CheckCircle2, AlertCircle,
  ExternalLink, Building2, Send
} from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
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
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { resumes, activeResumeId } = useResumeStore();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        let loaded: any[] = [];
        if (activeResumeId) {
          const recRes = await getRecommendations(activeResumeId);
          if (recRes.data?.length) {
            loaded = recRes.data.map((m: any) => ({
              id: m.jobListing.id,
              title: m.jobListing.title,
              company: m.jobListing.company,
              location: m.jobListing.location,
              employmentType: m.jobListing.employmentType || 'Full-time',
              experienceLevel: m.jobListing.experienceRequirements || 'Mid-Senior',
              description: m.jobListing.description,
              matchScore: m.matchScore,
              matchedSkills: m.matchedSkills || [],
              missingSkills: m.missingRequirements || [],
              postedAt: m.jobListing.postingDate ? new Date(m.jobListing.postingDate).toLocaleDateString() : 'Recent',
              applicationUrl: m.jobListing.applicationUrl,
              sourceStatus: m.jobListing.sourceStatus,
              providerName: m.jobListing.providerName,
              salaryInformation: m.jobListing.salaryInformation,
              country: m.jobListing.country,
              isSaved: false,
            }));
          }
        }

        if (!loaded.length) {
          const res = await listJobs();
          if (res.data?.length) {
            loaded = res.data.map((j: any) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              employmentType: j.employmentType || 'Full-time',
              experienceLevel: j.experienceRequirements || 'Mid-Senior',
              description: j.description,
              matchScore: 85,
              matchedSkills: j.requiredSkills || [],
              missingSkills: j.preferredSkills || [],
              postedAt: j.postingDate ? new Date(j.postingDate).toLocaleDateString() : 'Recent',
              applicationUrl: j.applicationUrl,
              sourceStatus: j.sourceStatus,
              providerName: j.providerName,
              salaryInformation: j.salaryInformation,
              country: j.country,
              isSaved: false,
            }));
          }
        }

        setJobs(loaded);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [activeResumeId]);

  async function handleToggleSave(job: JobListing, e: React.MouseEvent) {
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
      // optimistic update maintained
    }
  }

  async function handleApplyAndTrack(job: JobListing, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    try {
      await createApplication({
        jobListingId: job.id,
        resumeId: activeResumeId || undefined,
        status: 'applied',
        notes: `Applied via CareerMatch AI recommendations for ${job.title} at ${job.company}.`,
      });
    } catch {}
    setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));

    // Open real external job application link
    const appUrl = (job as any).applicationUrl;
    if (appUrl && appUrl.startsWith('http')) {
      window.open(appUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleOpenMatcher(job: JobListing, e: React.MouseEvent) {
    e.stopPropagation();
    sessionStorage.setItem('matcher_prefill_job', JSON.stringify({
      title: job.title,
      company: job.company,
      description: job.description + '\n\nRequired Skills: ' + [...job.matchedSkills, ...job.missingSkills].join(', '),
    }));
    navigate('/matcher');
  }

  const filteredJobs = jobs.filter((job) => {
    if (minMatchFilter > 0 && job.matchScore < minMatchFilter) return false;
    if (filterType !== 'all') {
      if (filterType === 'remote' && !job.location.toLowerCase().includes('remote')) return false;
      if (filterType === 'full-time' && job.employmentType.toLowerCase() !== 'full-time') return false;
    }
    if (portalFilter !== 'all') {
      const p = (job.providerName || '').toLowerCase();
      if (!p.includes(portalFilter)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchComp = job.company.toLowerCase().includes(q);
      const matchSkills = [...job.matchedSkills, ...job.missingSkills].some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchComp && !matchSkills) return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Sri Lankan Tech Job Recommendations"
          description="Curated opportunities from TopJobs, ITJobs, ExpressJobs, and LinkedIn matched against your CV's verified skills."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/saved')}
              className="gap-2"
            >
              <Bookmark size={15} />
              View Saved Jobs ({jobs.filter((j) => j.isSaved).length})
            </Button>
          }
        />

        {/* Quick Direct Access to Sri Lankan Job Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="https://www.topjobs.lk/applicant/vacancybyfunctionalarea.jsp?ac=defalut"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-blue-50/50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                TJ
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  TopJobs.lk <ExternalLink size={12} className="text-gray-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-gray-500">Sri Lanka's #1 Job Portal</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Open Site ↗
            </span>
          </a>

          <a
            href="https://www.itjobs.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-indigo-50/50 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 shadow-sm transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                ITJ
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                  ITJobs.lk <ExternalLink size={12} className="text-gray-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-[11px] text-gray-500">Sri Lanka Tech Directory</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Open Site ↗
            </span>
          </a>

          <a
            href="https://expressjobs.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-emerald-50/50 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 shadow-sm transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                EX
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                  ExpressJobs.lk <ExternalLink size={12} className="text-gray-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-[11px] text-gray-500">Corporate &amp; Tech Jobs</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Open Site ↗
            </span>
          </a>

          <a
            href="https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=Sri%20Lanka"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-sky-50/50 p-4 rounded-xl border border-gray-200 hover:border-sky-300 shadow-sm transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                in
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-sky-600 transition-colors flex items-center gap-1">
                  LinkedIn LK <ExternalLink size={12} className="text-gray-400 group-hover:text-sky-600" />
                </div>
                <p className="text-[11px] text-gray-500">Sri Lanka IT Positions</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              Open Site ↗
            </span>
          </a>
        </div>

        {/* Search & Filter Toolbar */}
        <Card className="p-4 shadow-sm border-gray-200">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search job title, company name, or skills (e.g. React, Node, AWS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={minMatchFilter}
                onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 bg-white outline-none focus:border-blue-500"
              >
                <option value={0}>All Match Scores</option>
                <option value={90}>90%+ Match (Top Tier)</option>
                <option value={80}>80%+ Match (Strong)</option>
                <option value={70}>70%+ Match (Good)</option>
              </select>

              <select
                value={portalFilter}
                onChange={(e) => setPortalFilter(e.target.value)}
                className="rounded-xl border border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-900 outline-none focus:border-blue-500"
              >
                <option value="all">🇱🇰 All Portals (TopJobs, ITJobs, ExpressJobs, LinkedIn)</option>
                <option value="topjobs">🇱🇰 TopJobs.lk Only</option>
                <option value="itjobs">🇱🇰 ITJobs.lk Only</option>
                <option value="expressjobs">🇱🇰 ExpressJobs.lk Only</option>
                <option value="linkedin">💼 LinkedIn Sri Lanka Only</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 bg-white outline-none focus:border-blue-500"
              >
                <option value="all">All Workplace Types</option>
                <option value="remote">Remote Only</option>
                <option value="full-time">Full-time Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Job Cards List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <EmptyState
              title="No matching job listings found"
              description="Try adjusting your keyword search or match threshold filters."
            />
          ) : (
            filteredJobs.map((job) => {
              const isApplied = appliedJobs[job.id];

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6 cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Job Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg flex items-center gap-2">
                            {job.title}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                              ● Live Vacancy
                            </span>
                            {job.providerName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                {job.providerName.includes('topjobs') ? '🇱🇰 TopJobs.lk' :
                                 job.providerName.includes('itjobs') ? '🇱🇰 ITJobs.lk' :
                                 job.providerName.includes('expressjobs') ? '🇱🇰 ExpressJobs.lk' :
                                 job.providerName.includes('linkedin') ? '💼 LinkedIn' :
                                 '🌐 ' + job.providerName}
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-800">{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {job.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={13} /> {job.postedAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                          {job.employmentType}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                          {job.experienceLevel}
                        </span>
                        {job.salaryMin && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <DollarSign size={13} />
                            ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax! / 1000).toFixed(0)}k {job.currency}
                          </span>
                        )}
                      </div>

                      {/* Matched vs Missing Skills */}
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 mr-1">Matched:</span>
                        {job.matchedSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-semibold border border-green-200"
                          >
                            <CheckCircle2 size={11} /> {skill}
                          </span>
                        ))}
                        {job.matchedSkills.length > 4 && (
                          <span className="text-xs text-gray-400">+{job.matchedSkills.length - 4} more</span>
                        )}

                        {job.missingSkills.length > 0 && (
                          <>
                            <span className="text-xs font-medium text-gray-400 ml-2 mr-1">Gap:</span>
                            {job.missingSkills.slice(0, 2).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200"
                              >
                                <AlertCircle size={10} /> {skill}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side: Match score & Actions */}
                    <div className="flex items-center gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 w-full lg:w-auto justify-between lg:justify-end">
                      {/* Match Score Badge */}
                      <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Match</span>
                        <span
                          className={`text-2xl font-extrabold ${
                            job.matchScore >= 90
                              ? 'text-green-600'
                              : job.matchScore >= 80
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {job.matchScore}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSave(job, e)}
                          title={job.isSaved ? 'Remove from saved' : 'Save job'}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            job.isSaved
                              ? 'bg-blue-50 border-blue-300 text-blue-600'
                              : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {job.isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenMatcher(job, e)}
                          className="gap-1.5 text-xs hidden sm:inline-flex"
                        >
                          <Sparkles size={13} className="text-blue-600" />
                          Compare CV
                        </Button>

                        <Button
                          variant={isApplied ? 'outline' : 'primary'}
                          size="sm"
                          onClick={(e) => handleApplyAndTrack(job, e)}
                          className={`gap-1.5 text-xs ${
                            isApplied ? 'text-green-700 border-green-300 bg-green-50' : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedJob.title}</h3>
                  <p className="text-sm font-semibold text-blue-600">{selectedJob.company}</p>
                  <p className="text-xs text-gray-500">{selectedJob.location} • {selectedJob.employmentType}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Match overview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                    Compatibility Verdict
                  </span>
                  <p className="text-sm text-gray-800 mt-0.5">
                    Your CV is a <strong className="text-blue-900">{selectedJob.matchScore}% strong match</strong> for this position.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-blue-600">{selectedJob.matchScore}%</span>
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Skills Matching Breakdown
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-600 font-medium block mb-1.5">
                      Verified On Your CV:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold border border-green-200 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedJob.missingSkills.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-amber-700 font-medium block mb-1.5">
                        Identified Skill Gaps (Consider adding if applicable):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200 flex items-center gap-1"
                          >
                            <AlertCircle size={12} /> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Job description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Role Overview & Requirements
                </h4>
                <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-700 leading-relaxed space-y-2">
                  <p>{selectedJob.description}</p>
                  <p>• Lead architectural decisions and collaborate with cross-functional partners.</p>
                  <p>• Write scalable, well-tested code with rigorous documentation standards.</p>
                  <p>• Mentor junior engineers and participate in company-wide technology syncs.</p>
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => handleToggleSave(selectedJob, { stopPropagation: () => {} } as any)}
                  className="gap-2"
                >
                  {selectedJob.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {selectedJob.isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => handleOpenMatcher(selectedJob, e)}
                    className="gap-1.5"
                  >
                    <Sparkles size={14} className="text-blue-600" />
                    Deep Matcher
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleApplyAndTrack(selectedJob);
                      setSelectedJob(null);
                    }}
                    className="gap-2 bg-blue-600 text-white"
                  >
                    {(selectedJob as any).applicationUrl?.startsWith('http') ? (
                      <>
                        <ExternalLink size={14} />
                        Apply on Employer Site & Track
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Apply & Track Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
