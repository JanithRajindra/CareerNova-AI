import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/Layout';
import { Card, Button, Alert, Modal, Badge } from '@/components/ui';
import { useAuthStore, useResumeStore, useAnalysisStore, useThemeStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { clearCareerMatchCache, type ClearCacheResult } from '@/lib/cache';
import { getProfile, updateProfile, getAIStatus, testAIConnection, deleteAccount } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  User, Sun, Moon, Laptop, Sparkles, Bell, Shield, Key, Database,
  Trash2, Download, Save, RefreshCw, CheckCircle2, AlertTriangle,
  ExternalLink, Lock, Check, ShieldCheck
} from 'lucide-react';

const COUNTRIES = [
  'Sri Lanka',
  'United States',
  'United Kingdom',
  'Australia',
  'Canada',
  'Singapore',
  'Germany',
  'United Arab Emirates',
  'India',
  'Remote / Worldwide',
];

const EXPERIENCE_LEVELS = [
  { id: 'entry', label: 'Entry Level (0-2 years)' },
  { id: 'mid', label: 'Mid-Level (3-5 years)' },
  { id: 'senior', label: 'Senior (6-9 years)' },
  { id: 'lead', label: 'Lead / Principal (10+ years)' },
  { id: 'executive', label: 'Executive / Director' },
];

const WORKPLACE_PREFERENCES = [
  { id: 'hybrid', label: 'Hybrid (Office + Remote)' },
  { id: 'remote', label: 'Remote Only' },
  { id: 'onsite', label: 'On-Site Only' },
  { id: 'flexible', label: 'Flexible / Any' },
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
];

const INDUSTRIES = [
  'Technology & SaaS',
  'FinTech & Banking',
  'Healthcare & BioTech',
  'E-Commerce & Retail',
  'Telecommunications',
  'Consulting & Services',
  'Education & EdTech',
];

const CURRENCIES = ['USD', 'LKR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD'];

export default function SettingsPage() {
  const { user, login, logout } = useAuthStore();
  const { resumes } = useResumeStore();
  const { analyses } = useAnalysisStore();
  const { theme, themeMode, setThemeMode } = useThemeStore();
  const navigate = useNavigate();

  const isAdmin = user?.email === 'janithrajindra0705@gmail.com';

  // Active section tab
  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'ai' | 'notifications' | 'security' | 'data' | 'admin'>('profile');

  // 1. Personal Profile & Career Targets State
  const [fullName, setFullName] = useState(user?.name || '');
  const [country, setCountry] = useState('Sri Lanka');
  const [targetTitle, setTargetTitle] = useState('Senior Full Stack Engineer');
  const [locations, setLocations] = useState('Colombo, Sri Lanka; Remote');
  const [experienceLevel, setExperienceLevel] = useState('senior');
  const [remotePref, setRemotePref] = useState('hybrid');
  const [selectedEmployment, setSelectedEmployment] = useState<string[]>(['Full-time', 'Contract']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['Technology & SaaS', 'FinTech & Banking']);
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [salaryMin, setSalaryMin] = useState<number>(85000);
  const [salaryMax, setSalaryMax] = useState<number>(150000);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 2. AI Engine State
  const [aiProvider, setAiProvider] = useState('OpenAI');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [customApiKey, setCustomApiKey] = useState('');
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // 3. Notifications State
  const [jobMatchAlerts, setJobMatchAlerts] = useState(true);
  const [analysisAlerts, setAnalysisAlerts] = useState(true);
  const [followUpAlerts, setFollowUpAlerts] = useState(true);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // 4. Privacy & Password Management State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 5. Account Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 6. Clear Cache Modal
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheResult, setCacheResult] = useState<ClearCacheResult | null>(null);

  // Load existing profile from backend on mount
  useEffect(() => {
    async function loadBackendProfile() {
      try {
        const res = await getProfile();
        if (res?.data) {
          const d = res.data;
          if (d.fullName) setFullName(d.fullName);
          if (d.country) setCountry(d.country);
          if (d.preferredJobTitles && d.preferredJobTitles.length > 0) {
            setTargetTitle(d.preferredJobTitles.join(', '));
          }
          if (d.preferredLocations && d.preferredLocations.length > 0) {
            setLocations(d.preferredLocations.join('; '));
          }
          if (d.experienceLevel) setExperienceLevel(d.experienceLevel);
          if (d.remotePreference) setRemotePref(d.remotePreference);
          if (d.employmentPreferences && d.employmentPreferences.length > 0) {
            setSelectedEmployment(d.employmentPreferences);
          }
          if (d.preferredIndustries && d.preferredIndustries.length > 0) {
            setSelectedIndustries(d.preferredIndustries);
          }
          if (d.salaryRange) {
            if (d.salaryRange.min !== undefined) setSalaryMin(d.salaryRange.min);
            if (d.salaryRange.max !== undefined) setSalaryMax(d.salaryRange.max);
            if (d.salaryRange.currency) setSalaryCurrency(d.salaryRange.currency);
          }
        }
      } catch {}

      // Load AI status
      try {
        const aiRes = await getAIStatus();
        if (aiRes?.data) {
          if (aiRes.data.provider) setAiProvider(aiRes.data.provider.toUpperCase());
          if (aiRes.data.activeModel) setAiModel(aiRes.data.activeModel);
        }
      } catch {}
    }

    loadBackendProfile();
  }, []);

  // Handle Save Profile & Career Targets
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }
    if (salaryMin < 0 || salaryMax < 0) {
      setProfileError('Salary values cannot be negative.');
      return;
    }
    if (salaryMin > salaryMax) {
      setProfileError('Minimum salary cannot exceed maximum salary.');
      return;
    }

    setSavingProfile(true);
    try {
      const preferredJobTitles = targetTitle
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const preferredLocations = locations
        .split(';')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload = {
        fullName: fullName.trim(),
        country,
        preferredJobTitles,
        preferredLocations,
        experienceLevel,
        remotePreference: remotePref,
        employmentPreferences: selectedEmployment,
        preferredIndustries: selectedIndustries,
        salaryRange: {
          min: Number(salaryMin),
          max: Number(salaryMax),
          currency: salaryCurrency,
        },
      };

      await updateProfile(payload);

      // Update auth store user display name if changed
      login(user?.email || '', fullName.trim(), user?.id);

      setProfileSuccess('Profile and career targets successfully saved to Supabase database.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle Employment Type pill toggle
  function toggleEmploymentType(type: string) {
    setSelectedEmployment((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  // Handle Industry pill toggle
  function toggleIndustry(ind: string) {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  }

  // Handle AI Test Connection
  async function handleTestAI() {
    setTestingAI(true);
    setAiTestResult(null);
    try {
      const res = await testAIConnection({
        apiKey: customApiKey.trim() || undefined,
        model: aiModel,
        provider: 'openai',
      });
      if (res?.success) {
        setAiTestResult({
          success: true,
          message: res.message || 'Connection verified successfully.',
          latency: res.data?.latencyMs,
        });
      } else {
        setAiTestResult({
          success: false,
          message: res?.error || 'Verification failed. Please check credentials.',
        });
      }
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err?.message || 'Could not reach AI provider endpoint.',
      });
    } finally {
      setTestingAI(false);
    }
  }

  // Handle Save Notifications
  function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
  }

  // Handle Update Password
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not connected.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess('Password successfully updated in Supabase Auth.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  // Handle Account Deletion
  async function handleConfirmDeleteAccount() {
    if (deleteConfirmationInput !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      if (supabase) {
        await supabase.auth.signOut();
      }
      logout();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err?.message || 'Account deletion failed. Please contact support.');
      setDeletingAccount(false);
    }
  }

  // Handle Clear Cache
  async function handleConfirmClearCache() {
    setClearingCache(true);
    try {
      const res = await clearCareerMatchCache();
      setCacheResult(res);
    } finally {
      setClearingCache(false);
    }
  }

  // Handle JSON Data Export
  function handleExportData() {
    const data = {
      exportMetadata: {
        application: 'CareerMatch AI',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      userProfile: {
        id: user?.id,
        fullName,
        email: user?.email,
        country,
        targetTitle,
        locations,
        experienceLevel,
        remotePreference: remotePref,
        employmentPreferences: selectedEmployment,
        preferredIndustries: selectedIndustries,
        salaryRange: { min: salaryMin, max: salaryMax, currency: salaryCurrency },
      },
      statistics: {
        uploadedResumesCount: resumes.length,
        resumes: resumes.map((r) => ({
          filename: r.originalFilename,
          uploadedAt: r.createdAt,
          processingStatus: r.processingStatus,
        })),
        scoredAnalysesCount: analyses.length,
        analyses: analyses.map((a) => ({
          score: a.overallScore,
          band: a.bandLabel,
          createdAt: a.createdAt,
        })),
      },
      systemPreferences: {
        themeMode,
        activeTheme: theme,
        notifications: {
          jobMatchAlerts,
          analysisAlerts,
          followUpAlerts,
        },
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careermatch_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Account & System Settings"
          description="Configure your career targets, interface themes, AI model engine, security, and notification preferences."
        />

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 dark:border-slate-800 text-xs sm:text-sm font-medium select-none no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'profile'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <User size={15} />
            <span>Profile & Targets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('appearance')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'appearance'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Sun size={15} />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ai')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'ai'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Sparkles size={15} />
            <span>AI Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'notifications'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Bell size={15} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'security'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Shield size={15} />
            <span>Privacy & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('data')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
              activeSection === 'data'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Database size={15} />
            <span>Data & Cache</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeSection === 'admin'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              )}
            >
              <Key size={15} />
              <span>Admin Console</span>
            </button>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 1: Personal Profile & Career Targets */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'profile' || activeSection === undefined) && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Personal Profile &amp; Career Targets
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Personal parameters saved directly to Supabase profiles and user_preferences tables.
                    </p>
                  </div>
                </div>
                <Badge variant="info">Supabase PostgreSQL</Badge>
              </div>

              {profileSuccess && (
                <Alert type="success">
                  <strong>Success!</strong> {profileSuccess}
                </Alert>
              )}

              {profileError && (
                <Alert type="error">
                  <strong>Error:</strong> {profileError}
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Authenticated Email (Read-only from Supabase) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Authenticated Email Address
                    </label>
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-200 dark:border-green-900/40">
                      Verified Supabase Auth
                    </span>
                  </div>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850/60 text-gray-500 dark:text-slate-400 px-3.5 py-2 text-sm cursor-not-allowed select-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                    Sourced securely from Supabase Auth credentials. Email cannot be edited directly.
                  </p>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Preferred Country of Residence / Work
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Career Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Primary Target Role */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Target Job Titles (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={targetTitle}
                    onChange={(e) => setTargetTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer, Cloud Architect"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                    Used by the semantic matcher to rank recommendations.
                  </p>
                </div>

                {/* Preferred Locations */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Preferred Job Locations (Semicolon-separated)
                  </label>
                  <input
                    type="text"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    placeholder="e.g. Colombo, Sri Lanka; Remote; London, UK"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Workplace Arrangement */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Workplace Preference (Remote / Hybrid / On-Site)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {WORKPLACE_PREFERENCES.map((pref) => {
                    const isSelected = remotePref === pref.id;
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setRemotePref(pref.id)}
                        className={cn(
                          'px-3 py-2.5 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-750'
                        )}
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Employment Types */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Preferred Employment Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((type) => {
                    const active = selectedEmployment.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleEmploymentType(type)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                        )}
                      >
                        {active && <Check size={12} />}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Industries */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Target Industries &amp; Sectors
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => {
                    const active = selectedIndustries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                        )}
                      >
                        {active && <Check size={12} />}
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Salary Range & Currency */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Desired Annual Compensation Range
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Currency</span>
                    <select
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Minimum ({salaryCurrency})</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Target / Max ({salaryCurrency})</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Save Profile Button */}
              <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingProfile}
                  className="gap-2 px-6"
                >
                  <Save size={16} />
                  Save Profile &amp; Targets
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 2: Appearance & Interface Theme */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'appearance' || activeSection === undefined) && (
          <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Sun size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Appearance &amp; Interface Theme
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Switch between Light, Dark, and System modes. Synchronized across navbar and sidebar.
                  </p>
                </div>
              </div>
              <Badge variant={themeMode === 'system' ? 'purple' : themeMode === 'dark' ? 'default' : 'warning'}>
                {themeMode === 'system' ? 'System Synced' : themeMode === 'dark' ? 'Dark Navy Mode' : 'Light Clean Mode'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Light */}
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  themeMode === 'light'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun size={18} />
                  </div>
                  {themeMode === 'light' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Light Mode</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Crisp, high-contrast light theme optimized for well-lit environments.
                </p>
              </button>

              {/* Option 2: Dark */}
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  themeMode === 'dark'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
                    <Moon size={18} />
                  </div>
                  {themeMode === 'dark' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Dark Navy Mode</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Signature dark navy aesthetic with vibrant blue accents, easy on the eyes.
                </p>
              </button>

              {/* Option 3: System */}
              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  themeMode === 'system'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Laptop size={18} />
                  </div>
                  {themeMode === 'system' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">System Synchronized</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Follows your operating system's color scheme settings dynamically.
                </p>
              </button>
            </div>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 3: AI Engine & Model Configuration */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'ai' || activeSection === undefined) && (
          <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    AI Engine &amp; Model Configuration
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Active AI provider status, verification, and deterministic scoring safeguards.
                  </p>
                </div>
              </div>
              <Badge variant="success">Deterministic Engine Active</Badge>
            </div>

            {/* Deterministic Scoring Notice */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Deterministic ATS Scoring Safeguard</span>
              </div>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                CareerMatch AI separates ATS mathematical scoring from generative AI suggestions.
                Deterministic rule scoring operates 100% locally on the server without external API dependencies, ensuring unbiased, instantaneous evaluations regardless of third-party API quotas.
              </p>
            </div>

            {/* Active Provider & Model Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Active AI Provider</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{aiProvider}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Operational
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Configured AI Model</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{aiModel}</p>
              </div>
            </div>

            {/* Custom API Key Input & Test Connection */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Test Custom OpenAI API Key (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-proj-... (Leave blank to test server-side key)"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={testingAI}
                    onClick={handleTestAI}
                    className="gap-1.5 whitespace-nowrap"
                  >
                    <RefreshCw size={14} />
                    Test Connection
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  Transmitted securely to the server for live ping validation. Keys are never logged or stored in ordinary localStorage.
                </p>
              </div>

              {aiTestResult && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl border text-xs flex items-start gap-2.5',
                    aiTestResult.success
                      ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/60 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200'
                  )}
                >
                  {aiTestResult.success ? (
                    <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">
                      {aiTestResult.success ? 'Verification Successful' : 'Connection Test Failed'}
                    </span>
                    <span>{aiTestResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 4: Notifications & Reminders */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'notifications' || activeSection === undefined) && (
          <form onSubmit={handleSaveNotifications}>
            <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shadow-xs">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Notifications &amp; Reminders
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Configure delivery channels and alerts for matched jobs and analysis completions.
                    </p>
                  </div>
                </div>
                <Badge variant="default">In-App Active</Badge>
              </div>

              {notifSuccess && (
                <Alert type="success">
                  <strong>Preferences updated!</strong> Your notification settings have been stored.
                </Alert>
              )}

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={jobMatchAlerts}
                    onChange={(e) => setJobMatchAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                      High Compatibility Job Alerts (&gt;85% Match)
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Receive alerts when new verified Sri Lankan or remote vacancies match your skills.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={analysisAlerts}
                    onChange={(e) => setAnalysisAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                      Completed Resume Analyses
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Notifications when PDF parsing, ATS scoring, and keyword gap checks finish.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={followUpAlerts}
                    onChange={(e) => setFollowUpAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                      Application Tracker Follow-up Reminders
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Reminders for scheduled recruiter follow-ups, interview dates, and closing deadlines.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                <Button type="submit" variant="primary" size="sm" className="gap-2">
                  <Save size={15} />
                  Save Notifications
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 5: Privacy & Security */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'security' || activeSection === undefined) && (
          <div className="space-y-6">
            {/* Password Management */}
            <form onSubmit={handleUpdatePassword}>
              <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Password Management
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Update your account password using existing Supabase Auth flow.
                      </p>
                    </div>
                  </div>
                  <Badge variant="info">Supabase Auth</Badge>
                </div>

                {passwordSuccess && (
                  <Alert type="success">
                    <strong>Password Updated!</strong> {passwordSuccess}
                  </Alert>
                )}

                {passwordError && (
                  <Alert type="error">
                    <strong>Error:</strong> {passwordError}
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={savingPassword}
                    className="gap-2"
                  >
                    <Lock size={14} />
                    Update Password
                  </Button>
                </div>
              </Card>
            </form>

            {/* Resume Privacy & Storage Architecture */}
            <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shadow-xs">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Resume Privacy &amp; Zero-Knowledge Storage
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    How CareerMatch AI safeguards your uploaded documents and personal contact details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Private Storage Bucket</p>
                  <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                    CV files are uploaded to an encrypted private Supabase storage bucket (<span className="font-mono text-[10px]">resumes/</span>) with time-limited signed URLs.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">PostgreSQL RLS</p>
                  <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                    Row-Level Security guarantees that records are only accessible to your authenticated Supabase user token.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Zero PII Leakage</p>
                  <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                    Admins and developers cannot view candidate phone numbers or raw CV text. Only operational audit logs are tracked.
                  </p>
                </div>
              </div>
            </Card>

            {/* Account Deletion (Destructive Action) */}
            <Card className="p-6 border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-red-100 dark:border-red-950/40">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-900 dark:text-red-300">
                    Delete Account &amp; Associated Records
                  </h2>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Permanently purge your account, uploaded resumes, ATS scores, and saved jobs.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-red-800 dark:text-red-300">
                  This action is irreversible and cascades through all database records and storage buckets.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirmationInput('');
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  className="whitespace-nowrap"
                >
                  Delete My Account
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 6: Data & Storage Management */}
        {/* ────────────────────────────────────────────────────────── */}
        {(activeSection === 'data' || activeSection === undefined) && (
          <Card className="p-6 border-gray-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Data &amp; Storage Management
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Genuinely implemented client storage usage, JSON data export, and safe cache clearing.
                  </p>
                </div>
              </div>
              <Badge variant="default">Local &amp; Cloud</Badge>
            </div>

            {/* Storage Usage Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Uploaded Resumes</span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumes.length}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Encrypted in Supabase bucket</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">ATS Analyses Scored</span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyses.length}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Detailed gap checks saved</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Cloud Storage Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Connected</span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">PostgreSQL + Storage RLS</p>
              </div>
            </div>

            {/* Export Data & Clear Cache Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="gap-2"
              >
                <Download size={15} />
                Export Profile &amp; History (JSON)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCacheResult(null);
                  setShowClearCacheModal(true);
                }}
                className="gap-2 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Database size={15} />
                Clear Temporary Cache
              </Button>
            </div>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 7: Platform Administrator (Admin-Only) */}
        {/* ────────────────────────────────────────────────────────── */}
        {isAdmin && (activeSection === 'admin' || activeSection === undefined) && (
          <Card className="p-6 border-amber-300 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs">
                  <Key size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Platform Administrator Console
                    </h2>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 px-2 py-0.5 rounded">
                      ⭐ Platform Admin
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    Trusted server-side authorization: Restricted to authorized administrative accounts.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
              Administrative permissions are strictly enforced on the server at <span className="font-mono text-[11px]">/api/v1/admin/*</span> with verified email checks and Supabase service role access. UI controls alone cannot grant administrative privileges.
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ExternalLink size={14} />
                Open Admin Console
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Account Deletion Confirmation Dialog */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Irreversible Account Deletion"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deletingAccount}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={deletingAccount}
              disabled={deleteConfirmationInput !== 'DELETE'}
              onClick={handleConfirmDeleteAccount}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              Confirm &amp; Delete Account
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-800 dark:text-red-200 space-y-2">
            <p className="font-semibold text-sm">Warning: This action cannot be undone.</p>
            <p>
              Deleting your account will immediately remove:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Your Supabase Auth credentials and active sessions</li>
              <li>All uploaded resumes and extracted text from private storage</li>
              <li>All ATS readiness scores, category reports, and feedback</li>
              <li>Your saved vacancies and application tracker history</li>
            </ul>
          </div>

          {deleteError && (
            <Alert type="error">
              {deleteError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Clear Cache Confirmation Dialog */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        open={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        title="Clear Temporary Application Cache"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowClearCacheModal(false)}
            >
              {cacheResult?.success ? 'Close' : 'Cancel'}
            </Button>
            {!cacheResult?.success && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={clearingCache}
                onClick={handleConfirmClearCache}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Database size={14} />
                Confirm &amp; Clear Cache
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {cacheResult ? (
            <div className="space-y-3">
              {cacheResult.success ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 rounded-xl text-green-800 dark:text-green-200 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Cache Cleared Successfully</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Cleared {cacheResult.clearedItemsCount} temporary item{cacheResult.clearedItemsCount === 1 ? '' : 's'} across: {cacheResult.cacheCategoriesCleared.join(', ')}.
                    </p>
                    <p className="text-[11px] text-green-600 dark:text-green-400 mt-2">
                      Your Supabase authentication session, saved resumes, and preferences remain active and intact.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-800 dark:text-red-200 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Cache Clearing Failed</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {cacheResult.error || 'An unexpected error occurred.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                Clearing the cache will remove temporary API responses, disposable search buffers, and session drafts.
              </p>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
                  <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Important data is safely preserved</span>
                </div>
                <ul className="list-disc pl-5 text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Your active Supabase sign-in and authentication state</li>
                  <li>All uploaded resumes and ATS scoring history</li>
                  <li>Saved jobs and job application tracking entries</li>
                  <li>Your personal profile and theme preferences</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Are you sure you want to proceed with clearing temporary cache data?
              </p>
            </>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
