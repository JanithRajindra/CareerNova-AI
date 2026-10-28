import React from 'react';
import { cn } from '@/lib/utils';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs',
    secondary: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-xs',
    outline: 'border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 shadow-xs',
    ghost: 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white active:bg-gray-200 dark:active:bg-slate-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs',
    link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto',
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };
  return (
    <button
      className={cn(base, variants[variant], variant !== 'link' && sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md', ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900/90 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm text-gray-900 dark:text-slate-100 transition-colors',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300',
    success: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-transparent dark:border-green-800/40',
    warning: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-transparent dark:border-yellow-800/40',
    error: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-transparent dark:border-red-800/40',
    info: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-800/40',
    purple: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-transparent dark:border-violet-800/40',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          error && 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20',
          props.disabled && 'bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-y',
          'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          error && 'border-red-400 dark:border-red-500',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          error && 'border-red-400 dark:border-red-500',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, className, color, showLabel, size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500');
  const heights = { sm: 'h-1.5', md: 'h-2.5' };
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('rounded-full transition-all duration-700', heights[size], barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">{Math.round(pct)}%</span>
      )}
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 10, className }: ScoreRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? '#16a34a' : score >= 75 ? '#2563eb' : score >= 60 ? '#ca8a04' : '#dc2626';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200 dark:text-slate-800 transition-colors" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Alert({ type = 'info', title, children, className, onClose }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/60 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/60 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200',
  };
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', styles[type], className)}>
      <div className="flex-1">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="self-start opacity-60 hover:opacity-100 text-lg leading-none cursor-pointer">×</button>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full border border-transparent dark:border-slate-800 transition-colors', widths[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none cursor-pointer">×</button>
          </div>
        )}
        <div className="p-6 text-gray-900 dark:text-slate-100">{children}</div>
        {footer && <div className="px-6 pb-6 pt-0">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-gray-300 dark:text-slate-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ─── Demo Banner (Disabled in Real Production Mode) ─────────────────────────
export function DemoBanner(_props?: { message?: string; className?: string; force?: boolean }) {
  return null;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-gray-200 dark:border-slate-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer',
            activeTab === tab.id
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-700'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-100 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-transparent dark:border-slate-700 shadow-sm">
        {text}
      </span>
    </span>
  );
}

