import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { listApplications, createApplication, updateApplication, deleteApplication } from '@/lib/api';
import {
  ClipboardList, Plus, Building2, MapPin, DollarSign, Calendar,
  MoreVertical, ChevronRight, CheckCircle2, Clock, AlertCircle,
  Briefcase, Trash2, Edit3, ArrowRight
} from 'lucide-react';

interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  status: 'interested' | 'applied' | 'interview' | 'offer' | 'rejected';
  salary?: string;
  appliedDate: string;
  interviewDate?: string;
  notes?: string;
}

const COLUMNS: { id: Application['status']; label: string; color: string; badgeBg: string }[] = [
  { id: 'interested', label: 'Wishlist / Interested', color: 'border-t-gray-400', badgeBg: 'bg-gray-100 text-gray-700' },
  { id: 'applied', label: 'Applied', color: 'border-t-blue-500', badgeBg: 'bg-blue-100 text-blue-700' },
  { id: 'interview', label: 'Interviewing', color: 'border-t-yellow-500', badgeBg: 'bg-yellow-100 text-yellow-800' },
  { id: 'offer', label: 'Offer Received 🎉', color: 'border-t-green-500', badgeBg: 'bg-green-100 text-green-800' },
  { id: 'rejected', label: 'Archived / Rejected', color: 'border-t-red-400', badgeBg: 'bg-red-100 text-red-700' },
];

const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    companyName: 'Stripe',
    jobTitle: 'Senior Full Stack Engineer',
    status: 'interview',
    salary: '$165,000 / yr',
    appliedDate: 'Oct 18, 2026',
    interviewDate: 'Oct 29, 2026 at 2:00 PM EST',
    notes: 'Technical screen passed with Engineering Manager. System design round scheduled next week.',
  },
  {
    id: 'app-2',
    companyName: 'Vercel Partner Studio',
    jobTitle: 'Lead Frontend Architect',
    status: 'applied',
    salary: '$180,000 / yr',
    appliedDate: 'Oct 22, 2026',
    notes: 'Applied with optimized CV (projected ATS score: 94). Follow-up check recommended by Nov 1.',
  },
  {
    id: 'app-3',
    companyName: 'FinTech Cloud Technologies',
    jobTitle: 'Cloud Infrastructure Engineer',
    status: 'interested',
    salary: '$150,000 / yr',
    appliedDate: 'Oct 24, 2026',
    notes: 'Tailoring CV keywords for AWS Lambda and Terraform prior to submission.',
  },
  {
    id: 'app-4',
    companyName: 'HealthTech AI Labs',
    jobTitle: 'Full Stack TypeScript Developer',
    status: 'offer',
    salary: '£95,000 / yr',
    appliedDate: 'Oct 08, 2026',
    notes: 'Offer letter received! Reviewing benefits and equity package.',
  },
];

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>(SAMPLE_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formCompany, setFormCompany] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formStatus, setFormStatus] = useState<Application['status']>('applied');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await listApplications();
        if (res.data?.length) {
          const mapped = res.data.map((a: any, i: number) => ({
            id: a.id || `app-backend-${i}`,
            companyName: a.companyName || a.jobListing?.company || 'Company',
            jobTitle: a.jobTitle || a.jobListing?.title || 'Engineer',
            status: a.status || 'applied',
            salary: a.salary || '$140,000 / yr',
            appliedDate: a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : 'Recent',
            interviewDate: a.interviewDate,
            notes: a.notes,
          }));
          setApplications(mapped);
        }
      } catch {
        // fallback to samples
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleStatusChange(id: string, newStatus: Application['status']) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    try {
      await updateApplication(id, { status: newStatus });
    } catch {
      // optimistic update maintained
    }
  }

  async function handleDelete(id: string) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    try {
      await deleteApplication(id);
    } catch {
      // optimistic
    }
  }

  async function handleAddApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!formCompany.trim() || !formTitle.trim()) return;

    const newApp: Application = {
      id: `app-custom-${Date.now()}`,
      companyName: formCompany.trim(),
      jobTitle: formTitle.trim(),
      salary: formSalary.trim() || undefined,
      status: formStatus,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: formNotes.trim() || undefined,
    };

    setApplications((prev) => [newApp, ...prev]);
    setIsModalOpen(false);

    // Reset form
    setFormCompany('');
    setFormTitle('');
    setFormSalary('');
    setFormStatus('applied');
    setFormNotes('');

    try {
      await createApplication({
        jobListingId: 'custom-job',
        status: newApp.status,
        notes: `${newApp.companyName} - ${newApp.jobTitle}. ${newApp.notes || ''}`,
      });
    } catch {
      // optimistic update
    }
  }

  // Application conversion statistics
  const totalApps = applications.length;
  const interviewCount = applications.filter((a) => a.status === 'interview' || a.status === 'offer').length;
  const offerCount = applications.filter((a) => a.status === 'offer').length;
  const interviewRate = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Job Application Pipeline Tracker"
          description="Manage every phase of your job search pipeline from initial interest to offer negotiation."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={16} />
              Add Application
            </Button>
          }
        />

        {/* Pipeline Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">Active Applications</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalApps}</div>
          </Card>
          <Card className="p-4 border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">Interview Rate</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{interviewRate}%</div>
          </Card>
          <Card className="p-4 border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">Interviews Scheduled</span>
            <div className="text-2xl font-extrabold text-yellow-600 mt-1">
              {applications.filter((a) => a.status === 'interview').length}
            </div>
          </Card>
          <Card className="p-4 border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">Offers Received</span>
            <div className="text-2xl font-extrabold text-green-600 mt-1">{offerCount}</div>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className={`bg-gray-50/75 rounded-2xl p-4 border border-gray-200 border-t-4 ${col.color} space-y-3 min-h-[420px]`}
              >
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-gray-800">{col.label}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-bold text-gray-600">
                      {colApps.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow transition-all space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-snug">
                            {app.jobTitle}
                          </h4>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">
                            {app.companyName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {app.salary && (
                        <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <DollarSign size={12} /> {app.salary}
                        </div>
                      )}

                      {app.interviewDate && (
                        <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-900 flex items-start gap-1.5">
                          <Calendar size={13} className="shrink-0 mt-0.5 text-yellow-600" />
                          <span>{app.interviewDate}</span>
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg">
                          {app.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>{app.appliedDate}</span>

                        {/* Stage Selector Dropdown */}
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as Application['status'])}
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 font-medium outline-none focus:border-blue-500"
                        >
                          <option value="interested">Wishlist</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Archived</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="h-28 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Application Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base">Add New Application</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddApplication} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Microsoft, Startup"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Salary (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. $150k"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stage</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as Application['status'])}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="interested">Wishlist</option>
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Context</label>
                  <textarea
                    rows={3}
                    placeholder="Recruiter contact, referral info, interview prep notes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Add to Pipeline
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
