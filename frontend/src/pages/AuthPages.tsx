import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Button, Input, Alert } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Eye, EyeOff, ShieldCheck, MailCheck, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { recordSessionLogin } from '@/lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase client is not configured.');
      }

      // Authenticate via Supabase Auth
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (sbError) {
        throw new Error(sbError.message);
      }

      if (data.session) {
        localStorage.setItem('sb-token', data.session.access_token);
      }

      login(
        data.user?.email || email.trim(),
        data.user?.user_metadata?.full_name || email.trim().split('@')[0],
        data.user?.id || ''
      );

      // Report active session for audit tracking
      recordSessionLogin();

      navigate('/dashboard');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. If you haven’t created an account yet, please click "Create Account" above.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Your email is not yet confirmed. Please click the verification link sent by Supabase.');
      } else {
        setError(msg || 'Login failed. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Back Link & Theme Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <ThemeToggle size="sm" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-8 transition-colors">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer" title="CareerMatch AI — Return to Home">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">CareerMatch <span className="text-blue-600 dark:text-blue-400">AI</span></span>
            </Link>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6">
            <Link
              to="/login"
              className="flex-1 py-2.5 text-center text-sm font-semibold border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-b-2 hover:border-gray-300 dark:hover:border-slate-700 transition-all"
            >
              Create Account
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Sign in to your Supabase career account</p>

          <div className="mb-5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-lg p-3 flex items-center gap-2 text-xs text-green-800 dark:text-green-300">
            <ShieldCheck size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>Connected to Supabase PostgreSQL &amp; Auth.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Sign In to Your Account
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase client is not configured.');
      }

      // 1. Direct registration in Supabase with verified status
      const registerRes = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Registration failed.');
      }

      // 2. Immediately sign in to get active session & JWT token
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        throw new Error(signInErr.message);
      }

      if (data.session) {
        localStorage.setItem('sb-token', data.session.access_token);
        login(email.trim(), name.trim(), data.user?.id);
        navigate('/dashboard');
      } else {
        setSuccessMsg(
          `Account registered for ${email}! Please proceed to sign in with your password.`
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Back Link & Theme Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <ThemeToggle size="sm" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-8 transition-colors">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer" title="CareerMatch AI — Return to Home">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">CareerMatch <span className="text-blue-600 dark:text-blue-400">AI</span></span>
            </Link>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6">
            <Link
              to="/login"
              className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-b-2 hover:border-gray-300 dark:hover:border-slate-700 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2.5 text-center text-sm font-semibold border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
            >
              Create Account
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Save your real CV analyses and job applications securely</p>

          <div className="mb-5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-lg p-3 flex items-center gap-2 text-xs text-green-800 dark:text-green-300">
            <ShieldCheck size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>Connected to Supabase PostgreSQL with Row-Level Security.</span>
          </div>

          {successMsg ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <MailCheck size={36} className="text-green-600 mx-auto mb-2.5" />
                <h3 className="font-bold text-green-900 text-sm mb-1.5">Check Your Email</h3>
                <p className="text-xs text-green-800 leading-relaxed">{successMsg}</p>
              </div>
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && <Alert type="error">{error}</Alert>}

              <Input
                label="Full name"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                Create Account
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}