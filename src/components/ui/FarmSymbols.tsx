import React, { useState } from 'react';

export type SymbolTone = 'sky' | 'teal' | 'amber' | 'rose' | 'indigo' | 'emerald';

const TONE_CLASSES: Record<SymbolTone, string> = {
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const SymbolBadge: React.FC<{
  tone?: SymbolTone;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ tone = 'sky', size = 'md', children }) => {
  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
        ? 'w-11 h-11 rounded-xl'
        : 'w-9 h-9 rounded-lg';

  return (
    <div
      className={`${sizeClass} border flex items-center justify-center shrink-0 ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
};

export const FishEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M21 12c-2.5-3.8-6.2-5.5-10.2-5.5-3.1 0-5.4 1.3-7.3 3.2L1.5 8v8l2-1.7c1.9 1.9 4.2 3.2 7.3 3.2 4 0 7.7-1.7 10.2-5.5Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="16.5" cy="11" r="1.1" fill="currentColor" />
    <path
      d="M11 8.5c-1.2 1.2-1.8 2.3-1.8 3.5s.6 2.3 1.8 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const VirusShieldSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.5 4.5 5.6v5.9c0 4.9 3.2 9.2 7.5 10.5 4.3-1.3 7.5-5.6 7.5-10.5V5.6L12 2.5Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 7v1.8M12 14.2V16M7.5 11.5h1.8M14.7 11.5h1.8M8.8 8.3l1.3 1.3M13.9 13.4l1.3 1.3M15.2 8.3l-1.3 1.3M10.1 13.4l-1.3 1.3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const PondGridSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.75"
    />
    <path
      d="M6.5 10c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.8 0M6.5 14.5c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.8 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const FeedPelletSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 13.5h16a7.5 7.5 0 0 1-15 0h-1Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="8.5" cy="9" r="1.4" fill="currentColor" />
    <circle cx="12.5" cy="6.5" r="1.4" fill="currentColor" />
    <circle cx="15.8" cy="9.5" r="1.4" fill="currentColor" />
  </svg>
);

export const WaterDropSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.8S5.5 10.1 5.5 14.7a6.5 6.5 0 1 0 13 0C18.5 10.1 12 2.8 12 2.8Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 15.2a2.8 2.8 0 0 0 2.7 2.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const HarvestBasketSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4.5 10h15l-1.5 9.5h-12L4.5 10Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 10 12 4.5 15.5 10M9 14v2.5M12 14v2.5M15 14v2.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const AquafarmImageBanner: React.FC<{
  imageSrc: string;
  imageAlt: string;
  kicker: string;
  title: string;
  subtitle: string;
  accentTone?: SymbolTone;
  symbol?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}> = ({
  imageSrc,
  imageAlt,
  kicker,
  title,
  subtitle,
  accentTone = 'teal',
  symbol,
  actionLabel,
  onAction,
}) => {
  const [imgErr, setImgErr] = useState(false);

  const fallbackGradient: Record<SymbolTone, string> = {
    sky: 'from-sky-800 to-cyan-700',
    teal: 'from-teal-800 to-emerald-700',
    amber: 'from-amber-700 to-orange-600',
    rose: 'from-rose-800 to-red-700',
    indigo: 'from-indigo-800 to-sky-700',
    emerald: 'from-emerald-800 to-teal-700',
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 relative min-h-[150px] lg:min-h-[168px]">
          {!imgErr ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div
              className={`w-full h-full absolute inset-0 bg-gradient-to-br ${fallbackGradient[accentTone]} flex items-center justify-center text-white/80`}
            >
              {symbol}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/35 via-slate-950/15 to-slate-900/75 lg:to-slate-900" />
        </div>

        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-300">
                {symbol && <span className="text-teal-300">{symbol}</span>}
                <span>{kicker}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-1">
                {title}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            </div>
          </div>

          {actionLabel && onAction && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onAction}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap"
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
