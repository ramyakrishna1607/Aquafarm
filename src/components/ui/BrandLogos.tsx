import React from 'react';

interface AquaFarmLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const AquaFarmLogo: React.FC<AquaFarmLogoProps> = ({
  size = 'md',
  theme = 'dark',
  showSubtitle = false,
}) => {
  const iconDim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const subSize = size === 'lg' ? 'text-xs' : 'text-[10px]';
  const titleColor = theme === 'light' ? 'text-white' : 'text-slate-900';
  const subColor = theme === 'light' ? 'text-sky-200' : 'text-slate-500';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDim} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="afBrandGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#afBrandGrad)" />
        {/* Stylized Fish Silhouette */}
        <path
          d="M34.5 21.2C30.8 16.5 24.4 14.8 18.8 16.8C15.8 17.9 13.7 19.8 12.2 21.5L8.5 18.2V26.2L12.2 22.9C13.9 24.7 16.4 26.5 19.7 27.3C25.3 28.6 31.1 26.1 34.5 21.2Z"
          fill="#ffffff"
        />
        <circle cx="28.5" cy="20.6" r="1.4" fill="#0369a1" />
        {/* Pond Water Ripple Waves */}
        <path
          d="M10 32.5C13.2 30.6 16.4 30.6 19.6 32.5C22.8 34.4 26 34.4 29.2 32.5C32.4 30.6 35.4 30.6 38 32.2"
          stroke="#99f6e4"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M13 37.5C15.8 36 18.5 36 21.3 37.5C24.1 39 26.9 39 29.7 37.5C31.9 36.3 33.8 36.2 35.5 37"
          stroke="#e0f2fe"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* Biosecurity Corner Beacon */}
        <circle cx="38" cy="10" r="3.2" fill="#2dd4bf" stroke="#ffffff" strokeWidth="1.4" />
      </svg>
      <div className="leading-none">
        <div className={`${titleSize} font-bold tracking-tight font-display ${titleColor} whitespace-nowrap`}>
          AquaFarm
        </div>
        {showSubtitle && (
          <div className={`${subSize} font-medium tracking-wide mt-0.5 ${subColor} whitespace-nowrap`}>
            Smart Aquaculture OS
          </div>
        )}
      </div>
    </div>
  );
};

export type ModuleLogoKind =
  | 'ponds'
  | 'feeding'
  | 'water'
  | 'virus'
  | 'harvest'
  | 'employees';

export const ModuleLogo: React.FC<{
  kind: ModuleLogoKind;
  size?: 'sm' | 'md';
}> = ({ kind, size = 'md' }) => {
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';

  if (kind === 'ponds') {
    return (
      <div className={`${box} bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
          <rect x="4" y="6" width="24" height="20" rx="5" stroke="#0369a1" strokeWidth="2" fill="#e0f2fe" />
          <path d="M8 15C10.5 13.5 13 13.5 15.5 15C18 16.5 20.5 16.5 23 15" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 20.5C11.5 19 14 19 16.5 20.5C19 22 21.5 22 24 20.5" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'feeding') {
    return (
      <div className={`${box} bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
          <path d="M7 8H25L21 16H11L7 8Z" fill="#ccfbf1" stroke="#0f766e" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="14" cy="21" r="1.7" fill="#0f766e" />
          <circle cx="19" cy="20" r="1.5" fill="#0369a1" />
          <circle cx="16.5" cy="25" r="1.7" fill="#0d9488" />
        </svg>
      </div>
    );
  }

  if (kind === 'water') {
    return (
      <div className={`${box} bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
          <path
            d="M16 4C16 4 8.5 13.2 8.5 18.8C8.5 23 11.8 26.5 16 26.5C20.2 26.5 23.5 23 23.5 18.8C23.5 13.2 16 4 16 4Z"
            fill="#e0f2fe"
            stroke="#0369a1"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12.5 20C14 18.7 15.5 18.7 17 20C18.5 21.3 20 21.3 21.2 20" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'virus') {
    return (
      <div className={`${box} bg-teal-50 border border-teal-300 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
          <path
            d="M16 4L26 8V15.5C26 21.6 21.7 26.9 16 28.5C10.3 26.9 6 21.6 6 15.5V8L16 4Z"
            fill="#ccfbf1"
            stroke="#0f766e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="15.5" r="4" stroke="#0369a1" strokeWidth="2" fill="#ffffff" />
          <path d="M16 9.5V11.5M16 19.5V21.5M10 15.5H12M20 15.5H22" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === 'harvest') {
    return (
      <div className={`${box} bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
          <path d="M6 13H26L23.5 25H8.5L6 13Z" fill="#e0f2fe" stroke="#0369a1" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 13C11 9.5 13 7.5 16 7.5C19 7.5 21 9.5 21 13" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 19H21" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // employees (Rupee + Staff badge)
  return (
    <div className={`${box} bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5" aria-hidden="true">
        <circle cx="13" cy="11.5" r="4" fill="#e0f2fe" stroke="#0369a1" strokeWidth="2" />
        <path d="M6.5 24C6.5 20.5 9.4 18 13 18C16.6 18 19.5 20.5 19.5 24" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 11H26M21 14.5H26M21 11C23.2 11 24.5 12.2 24.5 13.8C24.5 15.5 23.2 16.7 21 16.7L25.5 22" stroke="#0f766e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const SpeciesLogo: React.FC<{ species: string }> = ({ species }) => {
  const lower = species.toLowerCase();
  const isShrimp = lower.includes('shrimp') || lower.includes('prawn');
  const isCatfish = lower.includes('catfish');
  const isTrout = lower.includes('trout');

  const bg = isShrimp
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : isCatfish
      ? 'bg-slate-100 border-slate-200 text-slate-700'
      : isTrout
        ? 'bg-teal-50 border-teal-200 text-teal-700'
        : 'bg-sky-50 border-sky-200 text-sky-700';

  return (
    <div
      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}
      title={species}
    >
      {isShrimp ? (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
          <path
            d="M17 7C13 6 8.5 8 7.5 12C6.8 14.8 8.5 17.5 11.5 18.2C13.8 18.7 15.5 17.6 16.5 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M17 7L20 5M17 7L20 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
          <path
            d="M19 12C16.5 8.5 12 7.5 8 9.2L4.5 7V17L8 14.8C12 16.5 16.5 15.5 19 12Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="15.2" cy="11.5" r="1" fill="currentColor" />
        </svg>
      )}
    </div>
  );
};
