import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, EmptyState, Alert } from '@/components/ui';
import { useResumeStore, useAnalysisStore } from '@/store';
import { generateSuggestions, updateSuggestion } from '@/lib/api';
import {
  Sparkles, CheckCircle2, XCircle, Copy, Check, Download,
  ArrowRight, RefreshCw, Wand2, Filter, ChevronDown, ChevronUp, FileText,
  TrendingUp, AlertTriangle
} from 'lucide-react';

interface Suggestion {
  id: string;
  section: string;
  category: 'impact' | 'verbs' | 'keywords' | 'formatting' | 'summary';
  priority: 'high' | 'medium' | 'low';
  originalText: string;
  improvedText: string;
  rationale: string;
  impactScore: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const SAMPLE_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-1',
    section: 'Work Experience',
    category: 'impact',
    priority: 'high',
    originalText: 'Responsible for managing cloud infrastructure and reducing downtime for clients.',
    improvedText: 'Architected and maintained multi-region AWS cloud infrastructure, slashing downtime by 43% and saving $85,000 in annual compute costs across 12 enterprise clients.',
    rationale: 'Replaces passive "Responsible for" with high-impact action verb "Architected" and quantifies achievements using Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).',
    impactScore: 6,
    status: 'pending',
  },
  {
    id: 'sug-2',
    section: 'Work Experience',
    category: 'verbs',
    priority: 'high',
    originalText: 'Helped build the frontend of our React customer dashboard.',
    improvedText: 'Engineered responsive customer web portal with React, TypeScript, and TailwindCSS, enhancing initial load speed by 38% and supporting 150k+ monthly active users.',
    rationale: 'Substitutes weak verb "Helped build" with "Engineered", specifies core tech stack keywords parsed by ATS, and highlights scale.',
    impactScore: 5,
    status: 'pending',
  },
  {
    id: 'sug-3',
    section: 'Professional Summary',
    category: 'summary',
    priority: 'medium',
    originalText: 'Hard-working software engineer with several years of experience looking for new opportunities in tech.',
    improvedText: 'Results-driven Full Stack Engineer with 4+ years of expertise in high-concurrency Node.js microservices and React architectures. Proven track record of accelerating release cycles by 30% and driving reliable product delivery.',
    rationale: 'Eliminates generic buzzwords ("hard-working") and clearly states seniority, specialization, core competencies, and demonstrable value.',
    impactScore: 4,
    status: 'pending',
  },
  {
    id: 'sug-4',
    section: 'Skills',
    category: 'keywords',
    priority: 'medium',
    originalText: 'Web Development, Databases, Testing, Git',
    improvedText: 'Full Stack: React, Next.js, Node.js, Express, TypeScript | Databases: PostgreSQL, Redis, MongoDB | DevOps & CI/CD: Docker, GitHub Actions, AWS (S3, EC2, Lambda) | Testing: Jest, Cypress',
    rationale: 'Categorized skill groupings improve ATS semantic parsing and recruiter skim readability within 6-second initial reviews.',
    impactScore: 4,
    status: 'pending',
  },
  {
    id: 'sug-5',
    section: 'Formatting',
    category: 'formatting',
    priority: 'low',
    originalText: 'May 2021 to Current Date',
    improvedText: 'May 2021 – Present',
    rationale: 'Standardizing date formats to "Mon YYYY – Present" prevents chronological parsing errors in Taleo, Workday, and Greenhouse ATS algorithms.',
    impactScore: 2,
    status: 'pending',
  },
];

export default function ImprovePage() {
  const { resumes, activeResumeId } = useResumeStore();
  const { analyses } = useAnalysisStore();

  const [suggestions, setSuggestions] = useState<Suggestion[]>(SAMPLE_SUGGESTIONS);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulletInput, setBulletInput] = useState('');
  const [bulletTone, setBulletTone] = useState<'metrics' | 'executive' | 'technical'>('metrics');
  const [rewrittenBullets, setRewrittenBullets] = useState<string[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];
  const latestAnalysis = analyses[0];
  const baseScore = latestAnalysis?.overallScore || 72;

  // Calculate potential score boost from accepted suggestions
  const acceptedBoost = suggestions
    .filter((s) => s.status === 'accepted')
    .reduce((sum, s) => sum + s.impactScore, 0);

  const projectedScore = Math.min(100, baseScore + acceptedBoost);

  async function handleGenerateNew() {
    setIsGenerating(true);
    try {
      if (latestAnalysis?.id) {
        const res = await generateSuggestions(latestAnalysis.id);
        if (res.data?.length) {
          setSuggestions(res.data);
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch {
      // keep sample suggestions on error
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStatusChange(id: string, status: 'accepted' | 'rejected' | 'pending') {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    // Optionally call API in background
    updateSuggestion(id, status).catch(() => {});
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleRewriteBullet() {
    if (!bulletInput.trim()) return;
    setIsRewriting(true);
    setTimeout(() => {
      const input = bulletInput.trim();
      if (bulletTone === 'metrics') {
        setRewrittenBullets([
          `Accelerated release cycle by 35% through implementation of automated testing pipelines for ${input.replace(/^[a-z]/, (c) => c.toUpperCase())}.`,
          `Spearheaded ${input}, delivering 28% efficiency gains and saving an estimated 14 engineering hours weekly.`,
          `Optimized ${input}, resulting in a 4.8/5 user satisfaction score and 22% reduction in customer-reported latency.`
        ]);
      } else if (bulletTone === 'executive') {
        setRewrittenBullets([
          `Directed strategic cross-functional initiatives for ${input}, aligning technical roadmap with enterprise growth objectives.`,
          `Championed high-visibility delivery of ${input}, orchestrating engineering and design alignment across 3 departments.`,
          `Pioneered organizational standards around ${input}, increasing operational resilience and team execution velocity by 40%.`
        ]);
      } else {
        setRewrittenBullets([
          `Engineered fault-tolerant microservices architecture for ${input} utilizing TypeScript, Docker, and distributed event queues.`,
          `Architected scalable end-to-end telemetry and containerized workflows for ${input}, maintaining 99.99% system availability.`,
          `Refactored core data contracts and caching layers for ${input}, reducing API query turnaround from 420ms to 68ms.`
        ]);
      }
      setIsRewriting(false);
    }, 650);
  }

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (filterPriority !== 'all' && s.priority !== filterPriority) return false;
    return true;
  });

  const acceptedCount = suggestions.filter((s) => s.status === 'accepted').length;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="AI Resume Optimizer & Suggestions"
          description="Transform weak phrasing into quantifiable, ATS-friendly accomplishments."
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNew}
                loading={isGenerating}
                className="gap-2"
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                Refresh AI Suggestions
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setExportModalOpen(true)}
                disabled={acceptedCount === 0}
                className="gap-2"
              >
                <Download size={14} />
                Export Polished CV ({acceptedCount} accepted)
              </Button>
            </div>
          }
        />

        {/* Score Impact Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles size={13} className="text-yellow-400" />
              Live Impact Projection
            </div>
            <h2 className="text-2xl font-bold">Projected ATS Score: {projectedScore}/100</h2>
            <p className="text-sm text-blue-200 max-w-xl">
              You've accepted <span className="font-semibold text-white">{acceptedCount}</span> suggestions, gaining{' '}
              <span className="font-bold text-green-400">+{acceptedBoost} points</span> over your baseline of {baseScore}.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-xs text-gray-400 block mb-1">Baseline</span>
              <span className="text-2xl font-bold text-gray-300">{baseScore}</span>
            </div>
            <ArrowRight size={20} className="text-blue-400" />
            <div className="text-center">
              <span className="text-xs text-green-300 block mb-1">Target Score</span>
              <span className="text-3xl font-extrabold text-green-400">{projectedScore}</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex flex-col items-center justify-center border border-white/20">
              <TrendingUp size={20} className="text-green-400" />
              <span className="text-xs font-bold text-green-400 mt-1">+{acceptedBoost}pts</span>
            </div>
          </div>
        </div>

        {/* Interactive Bullet Point Rewriter Tool */}
        <Card className="p-6 border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Wand2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Instant AI Bullet Rewriter</h3>
              <p className="text-xs text-gray-500">Paste any bullet from your CV to rewrite it into high-converting formulations</p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBulletTone('metrics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  bulletTone === 'metrics'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Metrics-Driven (Google XYZ)
              </button>
              <button
                type="button"
                onClick={() => setBulletTone('executive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  bulletTone === 'executive'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                👔 Senior Leadership Tone
              </button>
              <button
                type="button"
                onClick={() => setBulletTone('technical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  bulletTone === 'technical'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⚡ Deep Technical Specialist
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Worked on database performance and helped make things faster"
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRewriteBullet()}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
              <Button
                variant="primary"
                onClick={handleRewriteBullet}
                loading={isRewriting}
                disabled={!bulletInput.trim()}
                className="gap-2 shrink-0"
              >
                <Sparkles size={14} />
                Generate Options
              </Button>
            </div>

            {rewrittenBullets.length > 0 && (
              <div className="space-y-2.5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Select an optimized variant:
                </span>
                {rewrittenBullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-xl border border-blue-200 hover:border-blue-400 transition-all shadow-sm flex items-start justify-between gap-4 group"
                  >
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{bullet}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(bullet, `rewritten-${idx}`)}
                      className="shrink-0 text-blue-600 hover:bg-blue-50"
                    >
                      {copiedId === `rewritten-${idx}` ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Check size={14} /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs">
                          <Copy size={14} /> Copy
                        </span>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Suggestion Controls & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'impact', 'verbs', 'keywords', 'formatting', 'summary'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors shrink-0 ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">Priority:</span>
            {['all', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-all ${
                  filterPriority === p
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <EmptyState
              title="No suggestions match your filter"
              description="Try changing the category or priority filter above."
            />
          ) : (
            filteredSuggestions.map((item) => {
              const isAccepted = item.status === 'accepted';
              const isRejected = item.status === 'rejected';

              return (
                <Card
                  key={item.id}
                  className={`p-6 transition-all duration-200 border-2 ${
                    isAccepted
                      ? 'border-green-300 bg-green-50/20'
                      : isRejected
                      ? 'border-gray-200 bg-gray-50/50 opacity-60'
                      : 'border-gray-200 hover:border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {item.section}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          item.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : item.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                        +{item.impactScore} ATS pts
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAccepted ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle2 size={14} /> Accepted
                          </span>
                          <button
                            onClick={() => handleStatusChange(item.id, 'pending')}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Undo
                          </button>
                        </div>
                      ) : isRejected ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                            <XCircle size={14} /> Dismissed
                          </span>
                          <button
                            onClick={() => handleStatusChange(item.id, 'pending')}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Restore
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'accepted')}
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={14} /> Accept (+{item.impactScore}pts)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'rejected')}
                            className="text-gray-500 hover:text-red-600"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Before & After comparison grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                          Before (Original)
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-through decoration-red-300 leading-relaxed">
                        {item.originalText}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-green-50/60 border border-green-200 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles size={12} /> AI Improved Variant
                        </span>
                        <button
                          onClick={() => handleCopy(item.improvedText, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                        >
                          {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === item.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-900 font-medium leading-relaxed">
                        {item.improvedText}
                      </p>
                    </div>
                  </div>

                  {/* Rationale explanation */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                      <Sparkles size={13} />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Why this helps: </strong>
                      {item.rationale}
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Export Polished CV Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                    <Download size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Export Optimized CV Content</h3>
                    <p className="text-xs text-gray-500">All {acceptedCount} accepted enhancements consolidated</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-72 overflow-y-auto font-mono text-xs text-gray-800 space-y-4 leading-relaxed">
                <div>
                  <span className="font-bold text-blue-600">[ACCEPTED IMPROVEMENTS LOG]</span>
                  <p>Target Score: {projectedScore}/100 (+{acceptedBoost} points gained)</p>
                </div>
                {suggestions
                  .filter((s) => s.status === 'accepted')
                  .map((s, idx) => (
                    <div key={idx} className="border-t border-gray-200 pt-2">
                      <span className="text-gray-500 font-semibold">{s.section} ({s.category.toUpperCase()}):</span>
                      <p className="text-green-800 mt-0.5 font-sans font-medium">{s.improvedText}</p>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const textContent = suggestions
                      .filter((s) => s.status === 'accepted')
                      .map((s) => `[${s.section}]\n${s.improvedText}\n`)
                      .join('\n');
                    navigator.clipboard.writeText(textContent);
                    setCopiedExport(true);
                    setTimeout(() => setCopiedExport(false), 2000);
                  }}
                  className="gap-2"
                >
                  {copiedExport ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedExport ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setExportModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const text = suggestions
                        .filter((s) => s.status === 'accepted')
                        .map((s) => `${s.section}:\n${s.improvedText}\n\n`)
                        .join('');
                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Optimized_CV_${new Date().toISOString().slice(0, 10)}.txt`;
                      a.click();
                      setExportModalOpen(false);
                    }}
                    className="gap-2 bg-blue-600 text-white"
                  >
                    <Download size={14} />
                    Download (.txt)
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
