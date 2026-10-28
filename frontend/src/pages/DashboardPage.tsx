import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, ScoreRing, ProgressBar, Badge, Skeleton, EmptyState, Button } from '@/components/ui';
import { useAuthStore, useResumeStore, useAnalysisStore } from '@/store';
import { listResumes, listAnalyses, listApplications } from '@/lib/api';
import { formatDate, getScoreBg, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS, timeAgo } from '@/lib/utils';
import { Upload, TrendingUp, Briefcase, ClipboardList, ChevronRight, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { resumes, setResumes, activeResumeId } = useResumeStore();
  const { analyses, setAnalyses, latestAnalysisId } = useAnalysisStore();
  const [applications, setApplications] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [resumeRes, analysisRes, appRes] = await Promise.all([
          listResumes(),
          listAnalyses(),
          listApplications(),
        ]);
        setResumes(resumeRes.data || []);
        setAnalyses(analysisRes.data || []);
        setApplications(appRes.data || []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latestAnalysis = analyses[0];
  const latestResume = resumes[0];

  const appStats = (applications as { status: string }[]).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋`}
          description="Here's your career dashboard overview."
          action={
            <Link to="/analyze">
              <Button variant="primary" size="sm" className="gap-2">
                <Upload size={15} /> Upload CV
              </Button>
            </Link>
          }
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard loading={loading} label="ATS Score" value={latestAnalysis?.overallScore ?? '—'} sub={latestAnalysis?.bandLabel || 'No analysis yet'} color={latestAnalysis ? 'text-blue-600' : 'text-gray-400'} icon={<TrendingUp size={20} className="text-blue-500" />} />
          <StatCard loading={loading} label="CVs Uploaded" value={resumes.length} sub="all time" icon={<Upload size={20} className="text-violet-500" />} />
          <StatCard loading={loading} label="Job Recommendations" value={latestAnalysis ? '8' : '—'} sub="based on latest CV" icon={<Briefcase size={20} className="text-green-500" />} />
          <StatCard loading={loading} label="Applications" value={(applications as unknown[]).length} sub={`${appStats['interview'] || 0} in interview`} icon={<ClipboardList size={20} className="text-orange-500" />} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Latest ATS Score */}
          <Card className="lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-4">Latest ATS Score</h2>
            {loading ? (
              <div className="flex justify-center py-8"><Skeleton className="w-32 h-32 rounded-full" /></div>
            ) : latestAnalysis ? (
              <div className="flex flex-col items-center">
                <ScoreRing score={latestAnalysis.overallScore} size={130} />
                <Badge className={`mt-4 ${getScoreBg(latestAnalysis.overallScore)}`}>
                  {latestAnalysis.bandLabel}
                </Badge>
                <p className="text-xs text-gray-400 mt-2">{formatDate(latestAnalysis.createdAt)}</p>
                <Link to={`/history`} className="mt-4 w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    View Full Report <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={<TrendingUp size={40} />}
                title="No analysis yet"
                description="Upload your CV to get your ATS readiness score."
                action={<Link to="/analyze"><Button variant="primary" size="sm">Analyse My CV</Button></Link>}
              />
            )}
          </Card>

          {/* Recent Analyses */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Analyses</h2>
              <Link to="/history" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.slice(0, 4).map((a: {id: string; overallScore: number; bandLabel: string; resumeId: string; createdAt: string}) => (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getScoreBg(a.overallScore)}`}>
                        {a.overallScore}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.bandLabel}</p>
                      <p className="text-xs text-gray-400">{timeAgo(a.createdAt)}</p>
                    </div>
                    <ProgressBar value={a.overallScore} size="sm" className="w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No analyses yet" description="Your analysis history will appear here." />
            )}
          </Card>

          {/* Latest CV */}
          <Card className="lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-4">Your CVs</h2>
            {loading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : resumes.length > 0 ? (
              <div className="space-y-2">
                {resumes.slice(0, 3).map((r: {id: string; originalFilename: string; createdAt: string}) => (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${r.id === activeResumeId ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{r.originalFilename}</p>
                      <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <Link to="/analyze" className="block mt-2">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Upload size={14} /> Upload New
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                title="No CVs uploaded"
                action={<Link to="/analyze"><Button variant="primary" size="sm" className="gap-1"><Upload size={14} /> Upload CV</Button></Link>}
              />
            )}
          </Card>

          {/* Application Summary */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Application Tracker</h2>
              <Link to="/tracker" className="text-xs text-blue-600 hover:underline">Manage all</Link>
            </div>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (applications as unknown[]).length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {['applied', 'interview', 'offer', 'rejected'].map((s) => (
                    <div key={s} className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{appStats[s] || 0}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{APPLICATION_STATUS_LABELS[s]}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {(applications as {id: string; status: string; jobListing?: {title: string; company: string}}[]).slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </span>
                      <span className="text-gray-700 truncate">{app.jobListing?.title || 'Unknown role'}</span>
                      <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{app.jobListing?.company}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No applications tracked"
                description="Start tracking jobs from the Job Recommendations page."
                action={<Link to="/jobs"><Button variant="outline" size="sm">Browse Jobs</Button></Link>}
              />
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ loading, label, value, sub, color = 'text-gray-900', icon }: {
  loading: boolean; label: string; value: string | number; sub: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <Card padding="md">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
          {icon && <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>}
        </div>
      )}
    </Card>
  );
}
