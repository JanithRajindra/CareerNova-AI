import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore, useResumeStore, useAnalysisStore } from '@/store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNavDropdown } from '@/components/UserNavDropdown';
import {
  LayoutDashboard, Upload, Sparkles, Briefcase, FileSearch,
  Bookmark, ClipboardList, History, Settings,
  ChevronRight, Menu, X, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze My CV', icon: Upload },
  { to: '/improve', label: 'Improve My CV', icon: Sparkles },
  { to: '/jobs', label: 'Job Recommendations', icon: Briefcase },
  { to: '/matcher', label: 'Job Description Matcher', icon: FileSearch },
  { to: '/saved', label: 'Saved Jobs', icon: Bookmark },
  { to: '/tracker', label: 'Application Tracker', icon: ClipboardList },
  { to: '/history', label: 'Analysis History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const { user } = useAuthStore();
  const { activeResumeId } = useResumeStore();
  const { analyses } = useAnalysisStore();

  const isAdmin = user?.email === 'janithrajindra0705@gmail.com';
  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/admin', label: 'Admin Console', icon: ShieldCheck }]
    : NAV_ITEMS;

  const latestScore = analyses[0]?.overallScore;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
      {/* Logo -> Redirects to / landing page */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-2.5 group" title="CareerMatch AI — Return to Home">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">CareerMatch</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm"> AI</span>
          </div>
        </Link>
      </div>

      {/* User Account Info */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.name || 'User Account'}</p>
              {isAdmin && (
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-900/50">
          <ShieldCheck size={13} className="text-green-600 dark:text-green-400" />
          <span className="font-medium">Supabase Cloud Connected</span>
        </div>

        {latestScore !== undefined && (
          <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-slate-800/80 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-800">
            <span className="text-xs text-gray-500 dark:text-slate-400">Latest ATS Score</span>
            <span className={cn(
              'ml-auto text-sm font-bold',
              latestScore >= 75 ? 'text-green-600 dark:text-green-400' : latestScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            )}>{latestScore}/100</span>
          </div>
        )}

        {!activeResumeId && (
          <NavLink
            to="/analyze"
            onClick={onCloseMobile}
            className="mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-semibold bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Upload size={13} />
            Upload Your CV
          </NavLink>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 group',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200'} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Theme */}
      <div className="px-3 pb-4 border-t border-gray-100 dark:border-slate-800 pt-3">
        <ThemeToggle variant="labeled" />
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 transition-colors">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-72 bg-white dark:bg-slate-900 h-full shadow-xl flex flex-col transition-colors">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 z-20 p-1"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <SidebarContent onCloseMobile={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Link to="/" className="font-semibold text-gray-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              CareerMatch AI
            </Link>
            <span>/</span>
            <span className="capitalize">{window.location.pathname.replace('/', '') || 'Dashboard'}</span>
          </div>

          <div className="flex items-center gap-3">
            {user?.email === 'janithrajindra0705@gmail.com' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs">
                ⭐ Platform Admin
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Supabase Connected
            </span>

            {/* Dark Mode Toggle in Desktop Top Header */}
            <ThemeToggle size="sm" />

            {/* User Profile Dropdown (Replaces standalone profile text and Sign Out) */}
            <div className="pl-3 border-l border-gray-200 dark:border-slate-700">
              <UserNavDropdown />
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-gray-600 dark:text-slate-300 p-1" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2 group" title="CareerMatch AI — Return to Home">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-violet-600 rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">CareerMatch <span className="text-blue-600 dark:text-blue-400">AI</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle in Mobile Header */}
            <ThemeToggle size="sm" />
            {/* User Profile Dropdown Menu in Mobile Header */}
            <UserNavDropdown mobile />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Page Header component
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}