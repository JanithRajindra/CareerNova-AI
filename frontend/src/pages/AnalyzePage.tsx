import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Alert, ProgressBar, Badge } from '@/components/ui';
import { useResumeStore, useAnalysisStore } from '@/store';
import { uploadResume, analyzeResume } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';
import { Upload, FileText, CheckCircle, AlertCircle, X, Zap, Target } from 'lucide-react';

type UploadStage = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

export default function AnalyzePage() {
  const navigate = useNavigate();
  const { addResume, setActiveResume, resumes } = useResumeStore();
  const { addAnalysis, setLatestAnalysis } = useAnalysisStore();

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedResume, setUploadedResume] = useState<Record<string, unknown> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [targetJob, setTargetJob] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ['.pdf', '.docx', '.doc'];
  const MAX_MB = 10;

  function validateFile(f: File): string {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Unsupported file type. Please upload a PDF or DOCX file.`;
    if (f.size > MAX_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_MB} MB.`;
    return '';
  }

  function handleFile(f: File) {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');
    setFile(f);
    setStage('idle');
    setUploadedResume(null);
    setAnalysisResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setStage('uploading');
    setError('');
    setUploadProgress(0);
    try {
      const res = await uploadResume(file, (pct) => setUploadProgress(pct));
      const resume = res.data;
      setUploadedResume(resume);
      addResume(resume);
      setActiveResume(resume.id);
      setStage('parsing');
      // Automatically trigger analysis
      await runAnalysis(resume.id);
    } catch (e) {
      setError((e as Error).message);
      setStage('error');
    }
  }

  async function runAnalysis(resumeId: string) {
    try {
      const res = await analyzeResume(resumeId, { targetJobTitle: targetJob || undefined });
      const result = res.data;
      setAnalysisResult(result);
      addAnalysis({
        id: result.id,
        resumeId: result.resumeId,
        overallScore: result.score.overall,
        band: result.score.band,
        bandLabel: result.score.bandLabel,
        targetJobTitle: result.targetJobTitle,
        createdAt: result.createdAt,
      });
      setLatestAnalysis(result.id);
      setStage('done');
    } catch (e) {
      setError((e as Error).message);
      setStage('error');
    }
  }

  const score = (analysisResult as {score?: {overall: number; bandLabel: string; completeness: number}})?.score;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader
          title="Analyse My CV"
          description="Upload your CV to get a detailed ATS readiness score and personalised recommendations."
        />

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Upload Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Drop Zone */}
            <Card padding="none">
              <div
                className={`border-2 border-dashed rounded-xl m-4 p-10 text-center transition-colors cursor-pointer ${
                  dragActive ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleInputChange} />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                      <FileText size={28} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setStage('idle'); setUploadedResume(null); setAnalysisResult(null); }}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <X size={12} /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Upload size={28} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Drop your CV here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-400">PDF or DOCX · Max {MAX_MB} MB</p>
                  </div>
                )}
              </div>

              {/* Optional job target */}
              <div className="px-6 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Job Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-gray-400 mt-1">Enables role-specific keyword analysis</p>
              </div>

              {/* Progress */}
              {(stage === 'uploading' || stage === 'parsing') && (
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{stage === 'uploading' ? 'Uploading…' : 'Analysing CV…'}</span>
                    <span className="text-sm text-gray-500">{stage === 'uploading' ? `${uploadProgress}%` : ''}</span>
                  </div>
                  <ProgressBar value={stage === 'uploading' ? uploadProgress : 65} color="bg-blue-500" />
                </div>
              )}

              {error && <div className="px-6 pb-4"><Alert type="error">{error}</Alert></div>}

              <div className="px-6 pb-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleUpload}
                  disabled={!file || stage === 'uploading' || stage === 'parsing'}
                  loading={stage === 'uploading' || stage === 'parsing'}
                >
                  <Zap size={18} />
                  {stage === 'uploading' ? 'Uploading…' : stage === 'parsing' ? 'Analysing…' : 'Upload & Analyse'}
                </Button>
              </div>
            </Card>

            {/* Success Result */}
            {stage === 'done' && score && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                  <h3 className="font-semibold text-gray-900">Analysis Complete</h3>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <p className="text-4xl font-bold text-blue-600">{score.overall}<span className="text-lg text-gray-400">/100</span></p>
                    <p className="text-sm text-gray-600 mt-1">{score.bandLabel}</p>
                  </div>
                  <div className="flex-1">
                    <ProgressBar value={score.overall} size="md" />
                    <p className="text-xs text-gray-400 mt-1">Analysis completeness: {score.completeness}%</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" size="sm" className="gap-1" onClick={() => navigate('/history')}>
                    <Target size={15} /> View Full Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/improve')}>
                    Improve CV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/jobs')}>
                    Find Jobs
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">What We Analyse</h3>
              <div className="space-y-3">
                {[
                  { label: 'Formatting & Structure', pts: '20 pts' },
                  { label: 'Skills & Keywords', pts: '25 pts' },
                  { label: 'Work Experience', pts: '20 pts' },
                  { label: 'Education', pts: '10 pts' },
                  { label: 'Contact Information', pts: '10 pts' },
                  { label: 'Readability & Grammar', pts: '10 pts' },
                  { label: 'Document Extraction', pts: '5 pts' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <Badge variant="default">{item.pts}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-2">Score Bands</h3>
              <div className="space-y-2 text-sm">
                {[
                  { range: '90–100', label: 'Strong ATS Readiness', color: 'text-green-600' },
                  { range: '75–89', label: 'Good – Minor Improvements', color: 'text-blue-600' },
                  { range: '60–74', label: 'Fair – Several Improvements', color: 'text-yellow-600' },
                  { range: '0–59', label: 'Needs Significant Work', color: 'text-red-600' },
                ].map((b) => (
                  <div key={b.range} className="flex items-center gap-2">
                    <span className={`font-semibold w-14 ${b.color}`}>{b.range}</span>
                    <span className="text-gray-500">{b.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">These are internal guidance bands, not universal ATS industry standards.</p>
            </Card>

            {/* Previous CVs */}
            {resumes.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Previous CVs</h3>
                <div className="space-y-2">
                  {resumes.slice(0, 3).map((r: {id: string; originalFilename: string; createdAt: string}) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate flex-1">{r.originalFilename}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0">{formatDate(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
