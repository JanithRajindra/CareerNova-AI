import { useThemeStore } from '@/store';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'labeled' | 'pill';
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, variant = 'icon', size = 'md' }: ThemeToggleProps) {
  const { theme, themeMode, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'relative inline-flex items-center gap-1.5 p-1 rounded-full border transition-all duration-200 select-none cursor-pointer',
          'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700',
          'dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200',
          className
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center rounded-full transition-all duration-200',
            size === 'sm' ? 'w-6 h-6' : 'w-7 h-7',
            !isDark ? 'bg-white shadow-xs text-amber-500' : 'text-gray-400'
          )}
        >
          <Sun size={size === 'sm' ? 13 : 15} />
        </span>
        <span
          className={cn(
            'flex items-center justify-center rounded-full transition-all duration-200',
            size === 'sm' ? 'w-6 h-6' : 'w-7 h-7',
            isDark ? 'bg-slate-900 shadow-xs text-blue-400' : 'text-gray-400'
          )}
        >
          <Moon size={size === 'sm' ? 13 : 15} />
        </span>
      </button>
    );
  }

  if (variant === 'labeled') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full',
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
          className
        )}
      >
        <div className="w-5 h-5 flex items-center justify-center text-blue-600 dark:text-amber-400">
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </div>
        <span className="flex-1 text-left">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          {themeMode === 'system' ? 'System' : isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode (currently Dark)' : 'Switch to dark mode (currently Light)'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs',
        'dark:bg-slate-850 dark:hover:bg-slate-800 dark:border-slate-700/80 dark:text-slate-200 dark:hover:text-amber-300',
        className
      )}
    >
      {isDark ? (
        <Sun size={size === 'sm' ? 16 : 18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={size === 'sm' ? 16 : 18} className="text-slate-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
