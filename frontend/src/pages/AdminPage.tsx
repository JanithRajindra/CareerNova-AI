import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store';
import { getAdminStats } from '@/lib/api';
import {
  ShieldCheck, Users, FileText, BarChart2, Briefcase, Database,
  CheckCircle2, Lock, ExternalLink, RefreshCw, Globe, Activity,
  Laptop, MapPin, Clock, EyeOff
} from 'lucide-react';

interface UserOverview {
  userId: string;
  email: string;
  role: 'admin' | 'candidate';
  isCurrentUser: boolean;
  registeredAt: string;
  lastSignInAt: string;
  lastIpAddress: string;
  lastDevice: string;
  location: string;
  resumesUploadedCount: number;
  atsScansCompletedCount: number;
  dataPrivacyStatus: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  location: string;
  action: string;
  timestamp: string;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.email?.toLowerCase() === 'janithrajindra0705@gmail.com';

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load administrator metrics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
          <p className="text-sm text-gray-500">
            This console is reserved exclusively for the platform administrator (<strong>janithrajindra0705@gmail.com</strong>).
          </p>
        </div>
      </AppLayout>
    );
  }

  const users: UserOverview[] = stats?.users || [];
  const recentLogs: AuditLog[] = stats?.recentActivity || [];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="System Administrator Console"
          description="Real-time operational dashboard, live vacancy feeds, and candidate audit logs with Zero-Knowledge CV privacy."
          action={
            <Button variant="outline" size="sm" onClick={loadStats} loading={loading} className="gap-2">
              <RefreshCw size={14} /> Refresh Metrics
            </Button>
          }
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Top KPI Cards (Real DB counts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Accounts</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.platformMetrics?.totalRegisteredCandidates ?? '...'}
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">● Real Supabase Auth Records</p>
          </Card>

          <Card className="p-5 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Resumes Ingested</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.platformMetrics?.totalResumesParsed ?? '...'}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <EyeOff size={12} className="text-amber-500" /> Private Bucket (Zero-Knowledge)
            </p>
          </Card>

          <Card className="p-5 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ATS Analyses Run</span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <BarChart2 size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.platformMetrics?.totalATSAnalyses ?? '...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Deterministic multi-category scoring</p>
          </Card>

          <Card className="p-5 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Vacancies</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-green-600">
              {stats?.platformMetrics?.totalLiveVacancies ?? '...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">TopJobs, ITJobs, ExpressJobs &amp; LinkedIn</p>
          </Card>
        </div>

        {/* Real Candidate Activity & Session Audit Log (Zero-Knowledge: IP, Device, Timestamps only) */}
        <Card className="p-6 border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Candidate Activity &amp; Session Audit</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time tracking of candidate login activity, IP addresses, and device signatures. Zero-Knowledge privacy guarantees candidate CV contents remain hidden from administrators.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
              <ShieldCheck size={14} className="text-blue-600" />
              Zero-Knowledge Privacy Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Account / User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device &amp; Browser</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">CVs Uploaded</th>
                  <th className="py-3 px-4">ATS Scans</th>
                  <th className="py-3 px-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-400">
                      No candidate sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.userId} className={u.isCurrentUser ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50/80'}>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]" title={u.email}>{u.email}</span>
                          {u.isCurrentUser && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                              You (Admin)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{u.userId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-800">
                        {u.lastIpAddress}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Laptop size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[150px]" title={u.lastDevice}>{u.lastDevice}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin size={12} className="text-gray-400" />
                          {u.location}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{u.resumesUploadedCount}</span>
                          <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5" title="Administrator cannot view raw CV content">
                            <EyeOff size={10} /> Hidden
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {u.atsScansCompletedCount}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          {new Date(u.lastSignInAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Operational Events Stream */}
        {recentLogs.length > 0 && (
          <Card className="p-6 border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock size={16} className="text-gray-500" /> Recent Connection &amp; Operational Events
              </h3>
              <span className="text-xs text-gray-400">Last {recentLogs.length} events</span>
            </div>

            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">{log.userEmail}</span>
                      <span className="text-gray-500 ml-2">action: <span className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">{log.action}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 shrink-0">
                    <span className="font-mono text-[11px]">{log.ipAddress}</span>
                    <span className="text-gray-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Privacy & Zero-Knowledge Architecture Confirmation */}
        <Card className="p-6 border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <ShieldCheck size={18} className="text-blue-600" />
            <span>Candidate Data Privacy &amp; Zero-Knowledge Isolation Guarantee</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Strict isolation is active: Each registered candidate can <strong>only view their own CVs and ATS results</strong>. Developers and platform administrators <strong>cannot access or download raw candidate CV text or personal contact info</strong> (phone numbers, physical addresses). Only high-level operational logs (IP address, device signature, session timestamps, and aggregate counts) are surfaced here for system reliability and abuse monitoring.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-700 pt-1">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600" /> PostgreSQL Row-Level Security</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600" /> Isolated Supabase Storage per User UUID</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600" /> Zero Developer/Admin Access to Candidate Resumes</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
