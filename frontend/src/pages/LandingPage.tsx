import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNavDropdown } from '@/components/UserNavDropdown';
import {
  CheckCircle, Zap, Target, TrendingUp, Shield, ChevronRight,
  Upload, BarChart2, Star, FileText, Briefcase, ArrowRight, LogOut, User
} from 'lucide-react';

const FEATURES = [
  { icon: BarChart2, title: 'ATS Readiness Score', desc: 'Get a detailed score out of 100 with category-by-category breakdown of your CV\'s ATS compatibility.' },
  { icon: Zap, title: 'AI-Powered Improvements', desc: 'Receive intelligent suggestions to improve your professional summary, experience bullets, and keyword usage.' },
  { icon: Target, title: 'Job Description Matching', desc: 'Paste any job description and instantly see how well your CV matches — with a detailed gap analysis.' },
  { icon: Briefcase, title: 'Live Job Recommendations', desc: 'Discover relevant vacancies matched to your skills and experience with individual match percentages.' },
  { icon: FileText, title: 'CV Export', desc: 'Download an ATS-optimised version of your CV in PDF or DOCX format, ready to submit.' },
  { icon: TrendingUp, title: 'Application Tracker', desc: 'Track every job application from interest through offer — all in one organised view.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your CV', desc: 'Upload your PDF or DOCX resume. We extract and structure the content automatically.' },
  { step: '02', title: 'Get Your ATS Score', desc: 'Our deterministic scoring engine analyses formatting, skills, experience, and more.' },
  { step: '03', title: 'Review Recommendations', desc: 'See exactly what to improve, with before-and-after suggestions powered by AI.' },
  { step: '04', title: 'Find Matching Jobs', desc: 'Browse vacancies ranked by how well they match your profile and qualifications.' },
];

const FAQS = [
  { q: 'What is an ATS readiness score?', a: 'An ATS (Applicant Tracking System) readiness score reflects how well your CV is structured for automated parsing systems used by employers. It measures formatting, keyword use, section clarity, and experience depth against ATS standards.' },
  { q: 'Will the AI add false information to my CV?', a: 'Never. Our AI is explicitly constrained to improve the clarity and presentation of information already in your CV. It will not invent experience, qualifications, metrics, or skills.' },
  { q: 'Are the job listings real vacancies?', a: 'Yes. All listings are real vacancies curated directly from Sri Lanka’s top employment directories (TopJobs.lk, ITJobs.lk, ExpressJobs.lk, and LinkedIn Sri Lanka). Every vacancy includes a direct employer application URL and verified listing dates.' },
  { q: 'How is my CV data stored?', a: 'CVs are processed server-side and stored in your private Supabase storage bucket with PostgreSQL Row-Level Security. Developers and third parties cannot access your personal files.' },
  { q: 'Do I need an account to use the ATS scorer?', a: 'Yes, creating a free account allows you to securely save your CV analyses, review suggestions over time, and match vacancies to your profile.' },
];

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleGetStarted() {
    if (user) navigate('/analyze');
    else navigate('/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group cursor-pointer" title="CareerMatch AI — Return to Home">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">CareerMatch <span className="text-blue-600 dark:text-blue-400">AI</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a>
              <a href="#jobs" className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">Job Matching</a>
              <a href="#faq" className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Dark/Light Mode Toggle */}
              <ThemeToggle size="sm" />

              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/dashboard">
                    <Button variant="primary" size="sm">Dashboard</Button>
                  </Link>
                  <UserNavDropdown />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/60 to-white dark:from-slate-900/60 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-800/40 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Star size={12} />
            ATS-Optimised Resume Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            Make Your CV ATS-Ready.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Discover Jobs That Match
            </span>{' '}
            Your Potential.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Analyse your resume, discover improvement opportunities, and find job vacancies that match your skills and experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button variant="primary" size="lg" onClick={handleGetStarted} className="gap-2 w-full sm:w-auto shadow-md shadow-blue-500/20">
              <Upload size={18} />
              Analyse My CV Free
            </Button>
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="gap-2 w-full">
                Create Account <ChevronRight size={18} />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="gap-1 w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-slate-400">
            {['No credit card required', 'Works with PDF & DOCX', 'Privacy-first design'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
            <div className="bg-gray-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-800 px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400 dark:text-slate-400">CareerMatch AI — ATS Analysis</span>
            </div>
            <div className="p-8 grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 flex flex-col items-center justify-center border border-gray-100 dark:border-slate-800 rounded-xl p-6 bg-gradient-to-b from-blue-50 to-white dark:from-slate-850 dark:to-slate-900">
                <div className="relative">
                  <svg width="100" height="100" className="-rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="251.2" strokeDashoffset="60" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">76</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">/ 100</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mt-3">ATS Score</p>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Good Readiness</span>
              </div>
              <div className="sm:col-span-2 space-y-3">
                {[
                  { label: 'Formatting & Structure', pct: 80, color: 'bg-green-500' },
                  { label: 'Skills & Keywords', pct: 72, color: 'bg-blue-500' },
                  { label: 'Work Experience', pct: 75, color: 'bg-blue-500' },
                  { label: 'Readability', pct: 60, color: 'bg-yellow-500' },
                  { label: 'Contact Information', pct: 100, color: 'bg-green-500' },
                ].map((c) => (
                  <div key={c.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-slate-300">{c.label}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{c.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How CareerMatch AI Works</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">A simple four-step process from CV upload to job application — all in one platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="text-4xl font-black text-blue-100 dark:text-slate-800 mb-3">{step.step}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ArrowRight size={18} className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-blue-300 dark:text-blue-500 bg-white dark:bg-slate-900" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Everything You Need to Land Your Next Role</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">Comprehensive tools for every stage of your job search journey.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-700/60 hover:shadow-md transition-all group">
                <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
                  <f.icon size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Matching Section */}
      <section id="jobs" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Personalised Job Recommendations</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Each recommended vacancy comes with an individual match percentage showing how well it aligns with your skills, experience, and preferences — not a generic keyword count.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { label: 'Skill Match', desc: 'Required and preferred skills compared against your CV' },
              { label: 'Experience Fit', desc: 'Your background matched to the role\'s stated requirements' },
              { label: 'Missing Requirements', desc: 'Transparent gaps shown — not hidden behind a high score' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-5 backdrop-blur">
                <h4 className="font-semibold mb-2">{item.label}</h4>
                <p className="text-sm text-blue-100">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" size="lg" onClick={handleGetStarted} className="border-white text-white hover:bg-white/10 hover:text-white">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-4xl mx-auto text-center">
          <Shield size={40} className="text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Privacy & Security First</h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Your CV is stored in a private encrypted bucket. AI processing happens server-side — your data is never used for training AI models. You can delete your account and all associated data at any time.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-slate-300">
            {['Private storage only', 'No public CV URLs', 'Server-side AI processing', 'Full data deletion available', 'No data sold to third parties'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronRight size={16} className={`transition-transform text-gray-400 dark:text-slate-400 ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-gray-600 dark:text-slate-300 leading-relaxed border-t border-gray-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Optimise Your CV?</h2>
        <p className="text-gray-400 mb-8">Start with your free ATS analysis — no credit card required.</p>
        <Button variant="primary" size="lg" onClick={handleGetStarted}>
          Analyse My CV Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-violet-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="text-gray-400">CareerMatch AI</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
          <p>© {new Date().getFullYear()} CareerMatch AI</p>
        </div>
      </footer>
    </div>
  );
}
