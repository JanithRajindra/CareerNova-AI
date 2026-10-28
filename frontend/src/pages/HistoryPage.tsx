import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { useAnalysisStore, useResumeStore } from '@/store';
import {
  History, TrendingUp, Calendar, FileText, ArrowRight, CheckCircle2,
  AlertCircle, ChevronRight, Download, Upload, Eye
} from 'lucide-react';

interface HistoryItem {
  id: string;
  date: string;
  overallScore: number;
  targetJobTitle?: string;
  filename: string;
  breakdown: {
    formatting: number;
    skills: number;
    impact: number;
    atsReadiness: number;
  };
  keyFindings: string[];
}

const SAMPLE_HISTORY: HistoryItem[] = [
  {
    id: 'hist-3',
    date: 'Oct 26, 2026',
    overallScore: 88,
    targetJobTitle: 'Senior Full Stack Engineer',
    filename: 'Resume_Optimized_v3.pdf',
    breakdown: {
      formatting: 95,
      skills: 90,
      impact: 84,
      atsReadiness: 92,
    },
    keyFindings: [
      'Quantified 6 core achievements using metrics and scale indicators.',
      'ATS readability score jumped to top 10% tier.',
      'Tech stack keywords grouped cleanly into categorized domains.',
    ],
  },
  {
    id: 'hist-2',
    date: 'Oct 24, 2026',
    overallScore: 76,
    targetJobTitle: 'Full Stack Developer',
    filename: 'Resume_Updated_v2.docx',
    breakdown: {
      formatting: 82,
      skills: 78,
      impact: 68,
      atsReadiness: 80,
    },
    keyFindings: [
      'Replaced 4 passive verbs with active technical verbs.',
      'Standardized dates to single Mon YYYY format.',
      'Still needed more financial / metric-driven impact in role #2.',
    ],
  },
  {
    id: 'hist-1',
    date: 'Oct 19, 2026',
    overallScore: 62,
    targetJobTitle: 'Software Engineer',
    filename: 'Original_Resume.pdf',
    breakdown: {
      formatting: 70,
      skills: 64,
      impact: 50,
      atsReadiness: 65,
    },
    keyFindings: [
      'Original upload baseline.',
      'Identified tables and complex column structures causing ATS parsing drops.',
      'Lacked numerical metrics across work experience bullet points.',
    ],
  },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const { analyses } = useAnalysisStore();
  const [selectedAudit, setSelectedAudit] = useState<HistoryItem | null>(null);

  const historyList = SAMPLE_HISTORY;
  const initialScore = historyList[historyList.length - 1]?.overallScore || 62;
  const latestScore = historyList[0]?.overallScore || 88;
  const netGain = latestScore - initialScore;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Analysis History & Progress"
          description="Track your ATS score evolution across multiple CV revisions and job targets."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/analyze')}
              className="gap-2"
            >
              <Upload size={14} />
              Run New Scan
            </Button>
          }
        />

        {/* Score Progression Highlight Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200">
              Total Score Growth
            </span>
            <h2 className="text-2xl font-bold">
              +{netGain} Point Improvement
            </h2>
            <p className="text-xs text-blue-200 max-w-md">
              From your initial baseline of {initialScore} to your current score of {latestScore}/100.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-xs text-gray-400 block mb-1">Baseline</span>
              <span className="text-2xl font-bold text-gray-300">{initialScore}</span>
            </div>
            <ArrowRight size={20} className="text-blue-400" />
            <div className="text-center">
              <span className="text-xs text-green-300 block mb-1">Current Score</span>
              <span className="text-3xl font-extrabold text-green-400">{latestScore}</span>
            </div>
          </div>
        </div>

        {/* Timeline of Audits */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Previous Audits & Scans</h3>

          {historyList.map((item, idx) => (
            <Card
              key={item.id}
              className="p-6 hover:shadow-md transition-all border-gray-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      {item.filename}
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">
                          Latest
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.date}
                      </span>
                      {item.targetJobTitle && (
                        <>
                          <span>•</span>
                          <span>Target: <strong className="text-gray-700">{item.targetJobTitle}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Overall Score</span>
                    <span
                      className={`text-2xl font-black ${
                        item.overallScore >= 80
                          ? 'text-green-600'
                          : item.overallScore >= 70
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {item.overallScore}/100
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAudit(item)}
                    className="gap-1.5"
                  >
                    <Eye size={14} /> View Audit
                  </Button>
                </div>
              </div>

              {/* Category Breakdown Progress */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>ATS Formatting</span>
                    <span className="font-bold text-gray-800">{item.breakdown.formatting}%</span>
                  </div>
                  <ProgressBar value={item.breakdown.formatting} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Skills Density</span>
                    <span className="font-bold text-gray-800">{item.breakdown.skills}%</span>
                  </div>
                  <ProgressBar value={item.breakdown.skills} color="bg-indigo-500" />
                </div>
                <div>
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Impact & Metrics</span>
                    <span className="font-bold text-gray-800">{item.breakdown.impact}%</span>
                  </div>
                  <ProgressBar value={item.breakdown.impact} color="bg-yellow-500" />
                </div>
                <div>
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Parsing Cleanliness</span>
                    <span className="font-bold text-gray-800">{item.breakdown.atsReadiness}%</span>
                  </div>
                  <ProgressBar value={item.breakdown.atsReadiness} color="bg-green-500" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Audit Details Modal */}
        {selectedAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selectedAudit.filename}</h3>
                  <p className="text-xs text-gray-500">Scanned on {selectedAudit.date}</p>
                </div>
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between border border-blue-200">
                <span className="text-xs font-semibold text-blue-900">Total ATS Score:</span>
                <span className="text-2xl font-extrabold text-blue-700">
                  {selectedAudit.overallScore}/100
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Key Findings & Highlights:
                </span>
                <ul className="space-y-2 text-xs text-gray-700">
                  {selectedAudit.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <Button variant="primary" size="sm" onClick={() => setSelectedAudit(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
