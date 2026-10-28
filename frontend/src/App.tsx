import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import DashboardPage from '@/pages/DashboardPage';
import AnalyzePage from '@/pages/AnalyzePage';
import ImprovePage from '@/pages/ImprovePage';
import JobsPage from '@/pages/JobsPage';
import MatcherPage from '@/pages/MatcherPage';
import SavedJobsPage from '@/pages/SavedJobsPage';
import TrackerPage from '@/pages/TrackerPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import { useAuthStore } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const token = localStorage.getItem('sb-token');

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          localStorage.setItem('sb-token', data.session.access_token);
          login(
            data.session.user.email || 'user@careermatch.ai',
            data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
            data.session.user.id
          );
        } else {
          localStorage.removeItem('sb-token');
          logout();
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          localStorage.setItem('sb-token', session.access_token);
          login(
            session.user.email || 'user@careermatch.ai',
            session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            session.user.id
          );
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('sb-token');
          logout();
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [login, logout]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated Product Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/analyze" element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>} />
        <Route path="/improve" element={<ProtectedRoute><ImprovePage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path="/matcher" element={<ProtectedRoute><MatcherPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedJobsPage /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}