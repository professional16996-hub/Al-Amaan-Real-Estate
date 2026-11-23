import React, { useId, useMemo, useState } from 'react';

// ============================================================================
// 1. MULTI-SERIES LINE GRAPH (Smooth SVG Line + Gradient Area + Interactive Nodes)
// ============================================================================

export interface LineSeriesConfig {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface LineTrendChartProps {
  title: string;
  subtitle?: string;
  labels: string[];
  series: LineSeriesConfig[];
  valueFormatter?: (v: number) => string;
}

export const LineTrendChart: React.FC<LineTrendChartProps> = ({
  title,
  subtitle,
  labels,
  series,
  valueFormatter = (v) => String(v),
}) => {
  const uid = useId().replace(/:/g, '');
  const [activeIndex, setActiveIndex] = useState<number>(Math.max(0, labels.length - 1));

  const width = 560;
  const height = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxValue = useMemo(() => {
    const allVals = series.flatMap((s) => s.values);
    const max = Math.max(1, ...allVals);
    return Math.ceil(max * 1.2);
  }, [series]);

  const yTicks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxValue * t));
  }, [maxValue]);

  const getPoint = (idx: number, val: number) => {
    const count = Math.max(1, labels.length - 1);
    const x = padLeft + (labels.length === 1 ? plotW / 2 : (idx / count) * plotW);
    const y = padTop + plotH - (val / maxValue) * plotH;
    return { x, y };
  };

  const buildSmoothPath = (vals: number[]) => {
    if (!vals.length) return '';
    const pts = vals.map((v, i) => getPoint(i, v));
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const buildAreaPath = (vals: number[]) => {
    if (!vals.length) return '';
    const pts = vals.map((v, i) => getPoint(i, v));
    const line = buildSmoothPath(vals);
    const baseY = padTop + plotH;
    return `${line} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
  };

  const clampedIdx = Math.min(activeIndex, Math.max(0, labels.length - 1));

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9F7A31]">Line Graph</p>
          <h3 className="font-display text-xl font-semibold text-[#0B192C] mt-0.5">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Active Hover / Selected Period Summary */}
        {labels.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {labels[clampedIdx]}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-3 mt-0.5">
              {series.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-xs font-mono-num font-semibold text-[#0B192C]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {valueFormatter(s.values[clampedIdx] ?? 0)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" role="img" aria-label={title}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          {/* Y Gridlines */}
          {yTicks.map((tick, idx) => {
            const y = padTop + plotH - (tick / maxValue) * plotH;
            return (
              <g key={`${tick}-${idx}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={idx === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono-num"
                >
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}

          {/* Vertical Guide for Selected Point */}
          {labels.length > 0 && (
            <line
              x1={getPoint(clampedIdx, 0).x}
              y1={padTop}
              x2={getPoint(clampedIdx, 0).x}
              y2={padTop + plotH}
              stroke="#B89146"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.7"
            />
          )}

          {/* Areas & Smooth Lines */}
          {series.map((s) => (
            <g key={s.key}>
              <path d={buildAreaPath(s.values)} fill={`url(#grad-${uid}-${s.key})`} />
              <path
                d={buildSmoothPath(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Interactive Data Nodes & X Labels */}
          {labels.map((lbl, idx) => {
            const x = getPoint(idx, 0).x;
            const isSelected = idx === clampedIdx;
            return (
              <g key={`${lbl}-${idx}`}>
                {series.map((s) => {
                  const pt = getPoint(idx, s.values[idx] ?? 0);
                  return (
                    <circle
                      key={s.key}
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 5 : 3.2}
                      fill={isSelected ? '#FFFFFF' : s.color}
                      stroke={s.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                  );
                })}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-mono-num ${
                    isSelected ? 'fill-[#0B192C] font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {lbl}
                </text>
                {/* Invisible touch/hover hit target */}
                <rect
                  x={x - Math.max(18, plotW / Math.max(2, labels.length * 2))}
                  y={padTop}
                  width={Math.max(36, plotW / Math.max(1, labels.length))}
                  height={plotH + padBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
        {series.map((s) => (
          <div key={s.key} className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 2. BAR CHART (Grouped / Stacked Vertical Bars with Interactive Hover)
// ============================================================================

export interface BarGroupItem {
  label: string;
  segments: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }>;
}

interface PortfolioBarChartProps {
  title: string;
  subtitle?: string;
  items: BarGroupItem[];
  valueFormatter?: (v: number) => string;
}

export const PortfolioBarChart: React.FC<PortfolioBarChartProps> = ({
  title,
  subtitle,
  items,
  valueFormatter = (v) => String(v),
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const safeIdx = Math.min(selectedIdx, Math.max(0, items.length - 1));
  const selectedItem = items[safeIdx];

  const maxTotal = useMemo(() => {
    const totals = items.map((item) => item.segments.reduce((s, seg) => s + seg.value, 0));
    return Math.max(1, ...totals);
  }, [items]);

  const legendEntries = items[0]?.segments || [];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9F7A31]">Bar Analytics</p>
          <h3 className="font-display text-xl font-semibold text-[#0B192C] mt-0.5">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {selectedItem && (
          <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-right max-w-[220px]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate">
              {selectedItem.label}
            </p>
            <p className="text-xs font-mono-num font-semibold text-[#0B192C] mt-0.5">
              Total: {valueFormatter(selectedItem.segments.reduce((a, b) => a + b.value, 0))}
            </p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No project inventory records yet.</div>
      ) : (
        <div className="pt-2">
          <div className="grid gap-3 items-end h-[200px] border-b border-slate-200 pb-2 px-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map((item, idx) => {
              const total = item.segments.reduce((s, seg) => s + seg.value, 0);
              const heightPct = Math.max(6, Math.round((total / maxTotal) * 100));
              const active = idx === safeIdx;
              return (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => setSelectedIdx(idx)}
                  className="h-full flex flex-col justify-end items-center gap-1.5 group focus:outline-none"
                >
                  <span className={`text-[11px] font-mono-num font-semibold transition-colors ${active ? 'text-[#0B192C]' : 'text-slate-500'}`}>
                    {valueFormatter(total)}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[54px] rounded-t overflow-hidden flex flex-col-reverse border transition-all ${
                      active ? 'border-[#0B192C] ring-2 ring-[#B89146]/40' : 'border-transparent opacity-90 group-hover:opacity-100'
                    }`}
                  >
                    {item.segments.map((seg) => {
                      const segPct = total > 0 ? (seg.value / total) * 100 : 0;
                      if (seg.value <= 0) return null;
                      return (
                        <div
                          key={seg.key}
                          style={{ height: `${segPct}%`, backgroundColor: seg.color }}
                          title={`${seg.label}: ${valueFormatter(seg.value)}`}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 pt-2 px-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map((item, idx) => (
              <button
                key={`lbl-${item.label}-${idx}`}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`text-[11px] text-center truncate px-1 ${
                  idx === safeIdx ? 'font-semibold text-[#0B192C]' : 'text-slate-500'
                }`}
                title={item.label}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-3.5">
          {legendEntries.map((seg) => (
            <span key={seg.key} className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span>{seg.label}</span>
            </span>
          ))}
        </div>
        {selectedItem && (
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono-num text-slate-600">
            {selectedItem.segments.map((seg) => (
              <span key={seg.key}>
                {seg.label}: <strong className="text-[#0B192C]">{valueFormatter(seg.value)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. DONUT / RING CHART (Interactive Proportional Breakdown)
// ============================================================================

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DonutRingChartProps {
  title: string;
  subtitle?: string;
  centerLabel: string;
  slices: DonutSlice[];
}

export const DonutRingChart: React.FC<DonutRingChartProps> = ({
  title,
  subtitle,
  centerLabel,
  slices,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  const computedSlices = useMemo(() => {
    let offsetAcc = 0;
    return slices.map((slice) => {
      const ratio = total > 0 ? slice.value / total : 0;
      const arcLength = ratio * circumference;
      const dashOffset = -offsetAcc;
      offsetAcc += arcLength;
      return {
        ...slice,
        percent: total > 0 ? Math.round(ratio * 100) : 0,
        arcLength,
        dashOffset,
      };
    });
  }, [slices, total, circumference]);

  const highlighted = computedSlices.find((s) => s.id === hoveredId) || computedSlices[0] || null;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9F7A31]">Distribution Ring</p>
        <h3 className="font-display text-xl font-semibold text-[#0B192C] mt-0.5">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-2">
        <div className="sm:col-span-5 flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img" aria-label={title}>
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="20"
              />
              {total > 0 &&
                computedSlices.map((s) => {
                  const isActive = hoveredId === s.id;
                  return (
                    <circle
                      key={s.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={isActive ? 23 : 20}
                      strokeDasharray={`${s.arcLength} ${circumference}`}
                      strokeDashoffset={s.dashOffset}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setHoveredId(isActive ? null : s.id)}
                    />
                  );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="font-mono-num text-2xl font-semibold text-[#0B192C]">
                {hoveredId && highlighted ? `${highlighted.percent}%` : total}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 truncate max-w-[90px]">
                {hoveredId && highlighted ? highlighted.label : centerLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-7 space-y-2">
          {computedSlices.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(hoveredId === s.id ? null : s.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded border text-xs transition-colors ${
                hoveredId === s.id
                  ? 'border-[#0B192C] bg-slate-50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="font-medium text-slate-800 truncate">{s.label}</span>
              </span>
              <span className="font-mono-num text-slate-600 shrink-0">
                <strong className="text-[#0B192C]">{s.value}</strong> ({s.percent}%)
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. PRECISION ANALOG DIAL GAUGE PANEL (Calibrated Ticks + Needle Meter)
// ============================================================================

export interface AnalogMeterItem {
  id: string;
  label: string;
  valuePercent: number;
  detail: string;
  accentColor: string;
}

interface AnalogDialGaugePanelProps {
  title: string;
  subtitle?: string;
  meters: AnalogMeterItem[];
}

const SingleAnalogGauge: React.FC<{ meter: AnalogMeterItem }> = ({ meter }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(meter.valuePercent)));
  const cx = 100;
  const cy = 96;
  const r = 72;

  // Semi-circle goes from -180deg (left) to 0deg (right)
  const angleRad = Math.PI * (1 - clamped / 100);
  const needleLen = 58;
  const nx = cx + needleLen * Math.cos(angleRad);
  const ny = cy - needleLen * Math.sin(angleRad);

  const arcCircumference = Math.PI * r;
  const filledArc = (clamped / 100) * arcCircumference;

  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="p-4 rounded-md bg-[#F8FAFC] border border-slate-200 flex flex-col items-center text-center">
      <svg viewBox="0 0 200 122" className="w-full max-w-[200px] h-auto" role="img" aria-label={`${meter.label}: ${clamped}%`}>
        {/* Track Semi-Circle */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Active Value Arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={meter.accentColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filledArc} ${arcCircumference}`}
        />

        {/* Calibrated Analog Scale Ticks */}
        {ticks.map((t) => {
          const rad = Math.PI * (1 - t / 100);
          const x1 = cx + (r - 12) * Math.cos(rad);
          const y1 = cy - (r - 12) * Math.sin(rad);
          const x2 = cx + (r - 18) * Math.cos(rad);
          const y2 = cy - (r - 18) * Math.sin(rad);
          const lx = cx + (r - 27) * Math.cos(rad);
          const ly = cy - (r - 27) * Math.sin(rad);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth="1.5" />
              <text
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                className="fill-slate-400 text-[8px] font-mono-num"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Analog Brass / Navy Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#0B192C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6.5" fill="#0B192C" stroke="#D4AF37" strokeWidth="2.5" />

        {/* Readout */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          className="fill-[#0B192C] text-[15px] font-mono-num font-semibold"
        >
          {clamped}%
        </text>
      </svg>

      <p className="text-xs font-semibold text-[#0B192C] mt-1">{meter.label}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{meter.detail}</p>
    </div>
  );
};

export const AnalogDialGaugePanel: React.FC<AnalogDialGaugePanelProps> = ({
  title,
  subtitle,
  meters,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9F7A31]">Analog Dial Gauges</p>
        <h3 className="font-display text-xl font-semibold text-[#0B192C] mt-0.5">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {meters.map((meter) => (
          <SingleAnalogGauge key={meter.id} meter={meter} />
        ))}
      </div>
    </div>
  );
};
