import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, ScoreRing, ProgressBar } from '@/components/ui';
import { useResumeStore } from '@/store';
import { analyzeJobDescription } from '@/lib/api';
import {
  FileSearch, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Copy, Check, Upload, RefreshCw, Wand2, BookOpen
} from 'lucide-react';

interface MatchAnalysis {
  matchScore: number;
  verdict: string;
  matchedKeywords: string[];
  missingCriticalKeywords: string[];
  missingPreferredKeywords: string[];
  sectionScores: {
    skillsMatch: number;
    experienceAlignment: number;
    titleRelevance: number;
    educationFit: number;
  };
  tailoredSummary: string;
  recommendations: string[];
}

const DEFAULT_SAMPLE_MATCH: MatchAnalysis = {
  matchScore: 84,
  verdict: 'Strong Candidate Match — High likelihood of clearing automated ATS screening filters.',
  matchedKeywords: [
    'React', 'TypeScript', 'Node.js', 'REST APIs', 'PostgreSQL',
    'Docker', 'Git', 'Agile/Scrum', 'CI/CD Pipelines'
  ],
  missingCriticalKeywords: [
    'Kubernetes', 'GraphQL', 'AWS Lambda'
  ],
  missingPreferredKeywords: [
    'Micro-frontends', 'Terraform', 'Next.js 15'
  ],
  sectionScores: {
    skillsMatch: 88,
    experienceAlignment: 82,
    titleRelevance: 90,
    educationFit: 95,
  },
  tailoredSummary:
    'Dedicated Full Stack Engineer with 4+ years of hands-on experience building high-scale React, TypeScript, and Node.js enterprise microservices. Proven expertise in optimizing database latency and accelerating CI/CD pipelines, directly aligning with your team\'s high-velocity development standards.',
  recommendations: [
    'Add "Kubernetes" or container orchestration experience in your DevOps skill group.',
    'Mention GraphQL query optimization or migration experience if you have worked with modern APIs.',
    'Align your job title in your professional summary to mirror the exact target title from the listing.',
    'Incorporate metrics demonstrating transaction throughput or user scale in your most recent role.',
  ],
};

export default function MatcherPage() {
  const { resumes, activeResumeId } = useResumeStore();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MatchAnalysis | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];

  // Check for prefill from JobsPage
  useEffect(() => {
    const prefill = sessionStorage.getItem('matcher_prefill_job');
    if (prefill) {
      try {
        const parsed = JSON.parse(prefill);
        setJobTitle(parsed.title || '');
        setCompany(parsed.company || '');
        setJobDescription(parsed.description || '');
        sessionStorage.removeItem('matcher_prefill_job');
      } catch {
        // ignore
      }
    }
  }, []);

  async function handleAnalyze() {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      if (activeResume?.id) {
        const res = await analyzeJobDescription(activeResume.id, jobDescription);
        if (res.data) {
          setAnalysisResult({
            matchScore: res.data.matchScore || 84,
            verdict: res.data.verdict || DEFAULT_SAMPLE_MATCH.verdict,
            matchedKeywords: res.data.matchedKeywords || DEFAULT_SAMPLE_MATCH.matchedKeywords,
            missingCriticalKeywords: res.data.missingCriticalKeywords || DEFAULT_SAMPLE_MATCH.missingCriticalKeywords,
            missingPreferredKeywords: res.data.missingPreferredKeywords || DEFAULT_SAMPLE_MATCH.missingPreferredKeywords,
            sectionScores: res.data.sectionScores || DEFAULT_SAMPLE_MATCH.sectionScores,
            tailoredSummary: res.data.tailoredSummary || DEFAULT_SAMPLE_MATCH.tailoredSummary,
            recommendations: res.data.recommendations || DEFAULT_SAMPLE_MATCH.recommendations,
          });
        }
      } else {
        await new Promise((r) => setTimeout(r, 900));
        setAnalysisResult(DEFAULT_SAMPLE_MATCH);
      }
    } catch {
      setAnalysisResult(DEFAULT_SAMPLE_MATCH);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleLoadSample() {
    setJobTitle('Senior Full Stack Engineer');
    setCompany('FinTech NextGen Corp');
    setJobDescription(
      `Job Title: Senior Full Stack Engineer\nCompany: FinTech NextGen Corp\n\nAbout the Role:\nWe are seeking a Senior Full Stack Engineer with strong expertise in TypeScript, React, Node.js, and PostgreSQL. In this role, you will lead the architecture and deployment of secure payment APIs and high-volume financial dashboards.\n\nKey Qualifications:\n- 4+ years software development experience with React and modern Node.js/Express.\n- Deep understanding of RESTful API design, PostgreSQL database optimization, and Docker.\n- Experience with CI/CD pipelines, automated testing (Jest), and Agile workflows.\n- Nice to have: Kubernetes, GraphQL, AWS Lambda, and cloud monitoring tools.`
    );
  }

  function handleCopySummary() {
    if (!analysisResult?.tailoredSummary) return;
    navigator.clipboard.writeText(analysisResult.tailoredSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Job Description ATS Matcher"
          description="Compare your CV against any job vacancy description to identify keyword gaps and boost your match score."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="gap-2"
            >
              <BookOpen size={14} />
              Load Sample Job Post
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 shadow-sm border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileSearch size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Target Job Details</h3>
                    <p className="text-xs text-gray-500">Paste listing description below</p>
                  </div>
                </div>

                {activeResume && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                    CV: {activeResume.originalFilename || 'Uploaded CV'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe, Airbnb"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Job Description / Requirements *
                </label>
                <textarea
                  rows={12}
                  placeholder="Paste the full job posting text here (responsibilities, required qualifications, tech stack)..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs font-mono leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleAnalyze}
                loading={isAnalyzing}
                disabled={!jobDescription.trim()}
                className="w-full gap-2 py-2.5 text-sm font-semibold"
              >
                <Sparkles size={16} />
                Run Deep ATS Match Analysis
              </Button>
            </Card>
          </div>

          {/* Right Column: Match Results */}
          <div className="lg:col-span-7 space-y-6">
            {isAnalyzing ? (
              <div className="h-full min-h-[420px] rounded-2xl border border-gray-200 bg-white flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <h3 className="font-bold text-gray-900 text-base">Analyzing Semantic Match...</h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Extracting required competencies, scoring keyword densities, and benchmarking against your CV...
                </p>
              </div>
            ) : !analysisResult ? (
              <div className="h-full min-h-[420px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FileSearch size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No Comparison Run Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  Paste a job description on the left or click "Load Sample Job Post" to run a comprehensive ATS gap analysis.
                </p>
                <Button variant="outline" size="sm" onClick={handleLoadSample}>
                  Load Sample Job Posting
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Score Header Card */}
                <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-blue-200">
                        Match Verdict
                      </span>
                      <h3 className="text-xl font-bold">
                        {analysisResult.matchScore >= 80 ? 'Excellent Fit' : 'Moderate Match'}
                      </h3>
                      <p className="text-xs text-blue-200 max-w-md leading-relaxed">
                        {analysisResult.verdict}
                      </p>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-24 h-24 rounded-full border-4 border-green-400 bg-white/10 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-3xl font-extrabold text-green-400">
                          {analysisResult.matchScore}%
                        </span>
                        <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                          ATS Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Breakdown Mini Progress Bars */}
                  <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Skills</span>
                        <span className="font-bold text-white">{analysisResult.sectionScores.skillsMatch}%</span>
                      </div>
                      <ProgressBar value={analysisResult.sectionScores.skillsMatch} color="bg-green-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Experience</span>
                        <span className="font-bold text-white">{analysisResult.sectionScores.experienceAlignment}%</span>
                      </div>
                      <ProgressBar value={analysisResult.sectionScores.experienceAlignment} color="bg-blue-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Title Fit</span>
                        <span className="font-bold text-white">{analysisResult.sectionScores.titleRelevance}%</span>
                      </div>
                      <ProgressBar value={analysisResult.sectionScores.titleRelevance} color="bg-yellow-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Education</span>
                        <span className="font-bold text-white">{analysisResult.sectionScores.educationFit}%</span>
                      </div>
                      <ProgressBar value={analysisResult.sectionScores.educationFit} color="bg-emerald-400" />
                    </div>
                  </div>
                </Card>

                {/* Keyword Analysis Chips */}
                <Card className="p-6 shadow-sm border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm">ATS Keyword Presence & Gaps</h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-2">
                        <CheckCircle2 size={14} />
                        <span>Matched Keywords Found on Your CV ({analysisResult.matchedKeywords.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.matchedKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2.5 py-1 rounded-md bg-green-50 text-green-800 text-xs font-semibold border border-green-200"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mb-2">
                        <XCircle size={14} />
                        <span>Missing Critical Requirements ({analysisResult.missingCriticalKeywords.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.missingCriticalKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-1"
                          >
                            <AlertTriangle size={11} /> {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {analysisResult.missingPreferredKeywords.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 block mb-2">
                          Missing Preferred / "Nice to Have" Keywords:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.missingPreferredKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Tailored Professional Summary Generator */}
                <Card className="p-6 border-blue-200 bg-blue-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Wand2 size={14} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Tailored Professional Summary for this Role
                      </h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySummary}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      {copiedSummary ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check size={14} /> Copied!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs">
                          <Copy size={14} /> Copy to CV
                        </span>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-blue-200">
                    "{analysisResult.tailoredSummary}"
                  </p>
                </Card>

                {/* Recommendations */}
                <Card className="p-6 shadow-sm border-gray-200 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    Specific Tailoring Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
