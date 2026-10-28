import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { clearCareerMatchCache, type ClearCacheResult } from '@/lib/cache';
import { Modal, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Settings, Database, LogOut, ChevronDown, CheckCircle2,
  AlertTriangle, ShieldCheck, RefreshCw, Sparkles
} from 'lucide-react';

interface UserNavDropdownProps {
  className?: string;
  mobile?: boolean;
}

export function UserNavDropdown({ className, mobile = false }: UserNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cacheResult, setCacheResult] = useState<ClearCacheResult | null>(null);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email === 'janithrajindra0705@gmail.com';
  const initial = (user?.name || user?.email || 'U')[0].toUpperCase();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Navigate to Settings
  function handleGoToSettings() {
    setIsOpen(false);
    navigate('/settings');
  }

  // Open Clear Cache confirmation modal
  function handleOpenClearCache() {
    setIsOpen(false);
    setCacheResult(null);
    setShowClearCacheModal(true);
  }

  // Execute safe cache clearing
  async function handleConfirmClearCache() {
    setClearing(true);
    try {
      const result = await clearCareerMatchCache();
      setCacheResult(result);
    } finally {
      setClearing(false);
    }
  }

  // Sign out cleanly via Supabase without manual token manipulation
  async function handleSignOut() {
    setIsOpen(false);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    logout();
    navigate('/login');
  }

  return (
    <>
      <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
        {/* Profile Card Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          id="user-profile-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="User account menu"
          className={cn(
            'flex items-center gap-2 rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40',
            mobile
              ? 'p-1 hover:bg-gray-100 dark:hover:bg-slate-800'
              : 'p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200'
          )}
        >
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
            {initial}
          </div>

          {!mobile && (
            <>
              <div className="text-left min-w-0 max-w-[150px]">
                <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  'text-gray-400 dark:text-slate-400 transition-transform duration-200 ml-0.5',
                  isOpen && 'rotate-180'
                )}
              />
            </>
          )}
        </button>

        {/* Dropdown Menu Panel */}
        {isOpen && (
          <div
            role="menu"
            aria-labelledby="user-profile-menu-button"
            className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xl shadow-black/10 dark:shadow-black/50 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
          >
            {/* Header: User Profile Information */}
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.name || 'User Account'}
                    </p>
                    {isAdmin && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-100 dark:border-slate-800 my-1" />

            {/* Action 1: Settings */}
            <button
              type="button"
              role="menuitem"
              onClick={handleGoToSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:bg-blue-50 dark:group-focus:bg-blue-950/60 group-focus:text-blue-600 dark:group-focus:text-blue-400 transition-colors">
                <Settings size={15} />
              </div>
              <div className="flex-1">
                <span className="font-medium block leading-tight">Settings</span>
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Preferences & career targets</span>
              </div>
            </button>

            {/* Action 2: Clear Cache */}
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenClearCache}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-950/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-focus:bg-amber-50 dark:group-focus:bg-amber-950/60 group-focus:text-amber-600 dark:group-focus:text-amber-400 transition-colors">
                <Database size={15} />
              </div>
              <div className="flex-1">
                <span className="font-medium block leading-tight">Clear Cache</span>
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Purge temporary client data</span>
              </div>
            </button>

            {/* Divider */}
            <div className="border-b border-gray-100 dark:border-slate-800 my-1" />

            {/* Action 3: Sign Out (Destructive action styling) */}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-lg transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/40 group-focus:bg-red-100 dark:group-focus:bg-red-900/40 transition-colors">
                <LogOut size={15} />
              </div>
              <div className="flex-1">
                <span className="font-medium block leading-tight">Sign Out</span>
                <span className="text-[11px] text-red-400 dark:text-red-500">End your current session</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Clear Cache Confirmation Dialog */}
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
                loading={clearing}
                onClick={handleConfirmClearCache}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white"
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
                      Your authentication session and saved CV data remain active and intact.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-800 dark:text-red-200 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Cache Clearing Failed</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {cacheResult.error || 'An unexpected error occurred while clearing cache.'}
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

              {/* What will be preserved */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
                  <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Important data is safely preserved</span>
                </div>
                <ul className="list-disc pl-5 text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Your active Supabase sign-in and authentication state</li>
                  <li>All uploaded resumes and ATS scoring history</li>
                  <li>Saved jobs and job application tracking entries</li>
                  <li>Your chosen dark/light theme preference</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Are you sure you want to proceed with clearing temporary cache data?
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
