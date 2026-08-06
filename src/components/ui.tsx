import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Info, X, ChevronRight, Search } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  description?: string;
  gradient?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, description, gradient }) => (
  <motion.div
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
  >
    {gradient && (
      <div className={clsx("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradient)} />
    )}
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-200">
        {icon}
      </div>
      {trend && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
            trend.positive
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40'
          )}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</h4>
      <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</div>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{description}</p>
      )}
    </div>
  </motion.div>
);

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  badge?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, breadcrumbs, badge }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/60 dark:border-slate-800/80">
    <div className="space-y-1.5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />}
              <span className={clsx(idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-700 dark:text-slate-300' : 'hover:text-slate-900 dark:hover:text-white')}>
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {badge}
          </span>
        )}
      </div>
      {description && <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl">{description}</p>}
    </div>
    {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
  </div>
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 dark:bg-indigo-500 dark:hover:bg-indigo-600",
    secondary: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm",
    outline: "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 dark:bg-rose-500 dark:hover:bg-rose-600",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-500 dark:hover:bg-emerald-600"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  dot?: boolean;
  className?: string;
}> = ({ children, variant = 'neutral', dot = false, className }) => {
  const styles = {
    primary: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50',
    purple: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/50',
    success: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50',
    danger: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50',
    info: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  const dots = {
    primary: 'bg-indigo-500',
    purple: 'bg-purple-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        styles[variant],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dots[variant])} />}
      {children}
    </span>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  gradientHover?: boolean;
}> = ({ children, className, gradientHover = false }) => (
  <div
    className={clsx(
      'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm transition-all duration-200',
      gradientHover && 'hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md',
      className
    )}
  >
    {children}
  </div>
);

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
      {icon}
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl', className)} />
);
