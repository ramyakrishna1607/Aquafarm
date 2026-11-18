import React, { useState } from 'react';

export interface SeriesPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export const InteractiveAreaChart: React.FC<{
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
  unit: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  safeRange?: { min: number; max: number; label: string };
  height?: number;
}> = ({
  title,
  subtitle,
  data,
  unit,
  primaryLabel,
  secondaryLabel,
  primaryColor = '#0369a1',
  secondaryColor = '#0d9488',
  safeRange,
  height = 220,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="h-44 flex items-center justify-center text-xs text-slate-500">
          No data points available for selected filter.
        </div>
      </div>
    );
  }

  const width = 640;
  const padL = 46;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allValues = data.flatMap((d) =>
    d.secondaryValue !== undefined ? [d.value, d.secondaryValue] : [d.value]
  );
  if (safeRange) {
    allValues.push(safeRange.min, safeRange.max);
  }
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const spread = Math.max(1, rawMax - rawMin);
  const minVal = Math.max(0, rawMin - spread * 0.12);
  const maxVal = rawMax + spread * 0.12;

  const xFor = (i: number) =>
    data.length === 1 ? padL + plotW / 2 : padL + (i / (data.length - 1)) * plotW;
  const yFor = (v: number) => padT + ((maxVal - v) / (maxVal - minVal || 1)) * plotH;

  const primaryPoints = data.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(' ');
  const areaPoints = `${xFor(0)},${padT + plotH} ${primaryPoints} ${xFor(data.length - 1)},${padT + plotH}`;

  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => `${xFor(i)},${yFor(d.secondaryValue ?? 0)}`).join(' ')
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minVal + (maxVal - minVal) * (1 - t));
  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
            <span>{primaryLabel}</span>
          </span>
          {hasSecondary && secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: secondaryColor }} />
              <span>{secondaryLabel}</span>
            </span>
          )}
          {safeRange && (
            <span className="text-teal-700 font-medium">{safeRange.label}</span>
          )}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {safeRange && (
            <rect
              x={padL}
              y={Math.min(yFor(safeRange.max), padT + plotH)}
              width={plotW}
              height={Math.max(2, yFor(safeRange.min) - yFor(safeRange.max))}
              fill="#ccfbf1"
              fillOpacity={0.55}
            />
          )}

          {yTicks.map((tick, idx) => {
            const y = yFor(tick);
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono tabular-nums"
                >
                  {tick >= 100 ? Math.round(tick) : tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          <polygon points={areaPoints} fill={primaryColor} fillOpacity={0.1} />
          <polyline
            fill="none"
            stroke={primaryColor}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={primaryPoints}
          />

          {hasSecondary && (
            <polyline
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={secondaryPoints}
            />
          )}

          {data.map((d, i) => {
            const cx = xFor(i);
            const cy = yFor(d.value);
            const isHovered = hoverIdx === i;
            return (
              <g key={d.label + i}>
                <rect
                  x={cx - plotW / Math.max(2, data.length * 2)}
                  y={padT}
                  width={plotW / Math.max(1, data.length)}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padT}
                    x2={cx}
                    y2={padT + plotH}
                    stroke="#94a3b8"
                    strokeWidth={1}
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3}
                  fill="#ffffff"
                  stroke={primaryColor}
                  strokeWidth={2}
                />
                {hasSecondary && d.secondaryValue !== undefined && (
                  <circle
                    cx={cx}
                    cy={yFor(d.secondaryValue)}
                    r={isHovered ? 4.5 : 3}
                    fill="#ffffff"
                    stroke={secondaryColor}
                    strokeWidth={2}
                  />
                )}
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && hoverIdx !== null && (
          <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs tabular-nums">
            <span className="font-medium text-slate-700">{hovered.label}</span>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-sky-800">
                {primaryLabel}: {hovered.value.toLocaleString()} {unit}
              </span>
              {hasSecondary && hovered.secondaryValue !== undefined && (
                <span className="font-semibold text-teal-700">
                  {secondaryLabel}: {hovered.secondaryValue.toLocaleString()} {unit}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface BarItem {
  label: string;
  primary: number;
  secondary?: number;
}

export const GroupedBarChart: React.FC<{
  title: string;
  subtitle?: string;
  data: BarItem[];
  primaryLabel: string;
  secondaryLabel?: string;
  unitPrefix?: string;
  unitSuffix?: string;
  primaryColor?: string;
  secondaryColor?: string;
}> = ({
  title,
  subtitle,
  data,
  primaryLabel,
  secondaryLabel,
  unitPrefix = '',
  unitSuffix = '',
  primaryColor = '#0369a1',
  secondaryColor = '#0d9488',
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => (d.secondary !== undefined ? [d.primary, d.secondary] : [d.primary]))
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
            <span>{primaryLabel}</span>
          </span>
          {secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: secondaryColor }} />
              <span>{secondaryLabel}</span>
            </span>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-500">
          No records match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const pWidth = Math.max(2, (item.primary / maxVal) * 100);
            const sWidth =
              item.secondary !== undefined ? Math.max(2, (item.secondary / maxVal) * 100) : 0;
            const isActive = activeIdx === idx;
            return (
              <div
                key={item.label}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-slate-50' : ''}`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-800 truncate pr-2">{item.label}</span>
                  <span className="font-mono tabular-nums text-slate-600 shrink-0">
                    {unitPrefix}
                    {item.primary.toLocaleString()}
                    {unitSuffix}
                    {item.secondary !== undefined && (
                      <>
                        {' · '}
                        <span className="text-teal-700">
                          {unitPrefix}
                          {item.secondary.toLocaleString()}
                          {unitSuffix}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-full bg-slate-100 rounded-xs overflow-hidden">
                    <div
                      className="h-full rounded-xs transition-all duration-200"
                      style={{ width: `${pWidth}%`, backgroundColor: primaryColor }}
                    />
                  </div>
                  {item.secondary !== undefined && (
                    <div className="h-2.5 w-full bg-slate-100 rounded-xs overflow-hidden">
                      <div
                        className="h-full rounded-xs transition-all duration-200"
                        style={{ width: `${sWidth}%`, backgroundColor: secondaryColor }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const DonutBreakdown: React.FC<{
  title: string;
  subtitle?: string;
  slices: DonutSlice[];
  unitPrefix?: string;
  unitSuffix?: string;
}> = ({ title, subtitle, slices, unitPrefix = '', unitSuffix = '' }) => {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {total === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-500">
          No breakdown data available.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle
                cx={70}
                cy={70}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={18}
              />
              {slices.map((slice) => {
                const pct = slice.value / total;
                const dashLen = pct * circumference;
                const dashOffset = -cumulativeOffset;
                cumulativeOffset += dashLen;
                return (
                  <circle
                    key={slice.label}
                    cx={70}
                    cy={70}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={18}
                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-slate-500">Total</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {unitPrefix}
                {Math.round(total).toLocaleString()}
                {unitSuffix}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            {slices.map((slice) => {
              const pct = Math.round((slice.value / total) * 1000) / 10;
              return (
                <div key={slice.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-slate-700 truncate">{slice.label}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-900 shrink-0 ml-2">
                    {unitPrefix}
                    {Math.round(slice.value).toLocaleString()}
                    {unitSuffix}{' '}
                    <span className="text-slate-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
