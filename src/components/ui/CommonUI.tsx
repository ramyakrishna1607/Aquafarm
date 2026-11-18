import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { WaterStatusLevel } from '../../types/aquafarm';

export const StatusLabel: React.FC<{
  level: WaterStatusLevel | 'Active' | 'Harvest Ready' | 'Maintenance' | 'Resting' | 'Paid' | 'Pending' | 'Resolved' | 'Under Treatment' | 'Monitoring' | 'On Duty' | 'Off Duty' | 'On Leave' | 'Present' | 'Half Day' | 'Absent';
}> = ({ level }) => {
  switch (level) {
    case 'Normal':
    case 'Active':
    case 'Paid':
    case 'Resolved':
    case 'On Duty':
    case 'Present':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{level}</span>
        </span>
      );
    case 'Harvest Ready':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{level}</span>
        </span>
      );
    case 'Warning':
    case 'Maintenance':
    case 'Pending':
    case 'Monitoring':
    case 'Half Day':
    case 'On Leave':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{level}</span>
        </span>
      );
    case 'Critical':
    case 'Under Treatment':
    case 'Absent':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{level}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{level}</span>
        </span>
      );
  }
};

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, maxWidth = 'max-w-xl', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${maxWidth} bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden my-auto`}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-white border border-slate-200 rounded-xl">
    <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 px-4 py-2 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const StatTile: React.FC<{
  label: string;
  value: string;
  detail?: string;
  accent?: 'sky' | 'teal' | 'amber' | 'red' | 'slate' | 'indigo' | 'emerald';
  symbol?: React.ReactNode;
}> = ({ label, value, detail, accent = 'sky', symbol }) => {
  const valueColor =
    accent === 'teal'
      ? 'text-teal-700'
      : accent === 'emerald'
        ? 'text-emerald-700'
        : accent === 'amber'
          ? 'text-amber-700'
          : accent === 'red'
            ? 'text-rose-700'
            : accent === 'indigo'
              ? 'text-indigo-700'
              : accent === 'sky'
                ? 'text-sky-800'
                : 'text-slate-900';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        {symbol && <div className="shrink-0">{symbol}</div>}
      </div>
      <div className={`text-2xl font-bold tracking-tight tabular-nums mt-2 ${valueColor}`}>
        {value}
      </div>
      {detail && <div className="text-xs text-slate-500 mt-1.5 truncate">{detail}</div>}
    </div>
  );
};
