"use client";

// Single-hue charts in the brand colour (urblue): every chart here encodes one measure, so no
// categorical palette is needed. Each chart has a hover tooltip and an accessible table view.

import { useId, useState, type ReactNode } from "react";

const BAR = "#00628b";
const BAR_MUTED = "#b8d8e6";
const GRID = "#e2e8f0";
const INK_MUTED = "#64748b";

export type Datum = { label: string; value: number; detail?: string };

function fmt(n: number, unit = "") {
  return unit === "%" ? `${n.toFixed(1)}%` : `${n.toLocaleString("en-US")}${unit}`;
}

export function ChartCard({
  title,
  subtitle,
  children,
  table,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  table?: { columns: string[]; rows: (string | number)[][] };
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
      {table && (
        <details className="mt-4 border-t border-slate-100 pt-3 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-urblue">Show data table</summary>
          <div className="mt-2 max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>{table.columns.map((c) => <th key={c} className="py-1 pr-3 font-medium">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className="py-1 pr-3 tabular-nums">{typeof c === "number" ? c.toLocaleString("en-US") : c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

// Ranked horizontal bars on one baseline. `highlight` draws one bar in the accent and the rest muted.
export function BarList({ data, unit = "", max, highlight }: { data: Datum[]; unit?: string; max?: number; highlight?: string }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-500">No data for this filter.</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => {
        const muted = highlight !== undefined && d.label !== highlight;
        return (
          <li
            key={d.label}
            className="relative grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 rounded-md py-0.5 sm:grid-cols-[minmax(0,13rem)_1fr_auto]"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="truncate text-sm text-slate-700" title={d.label}>{d.label}</span>
            <span className="h-3 rounded-r bg-transparent">
              <span
                className="block h-full rounded-r transition-[width]"
                style={{ width: `${Math.max(0.5, (d.value / top) * 100)}%`, background: muted ? BAR_MUTED : BAR, opacity: hover !== null && hover !== i ? 0.55 : 1 }}
              />
            </span>
            <span className="text-right text-sm font-semibold tabular-nums text-slate-800">{fmt(d.value, unit)}</span>
            {hover === i && d.detail && (
              <span role="tooltip" className="pointer-events-none absolute -top-9 left-1/3 z-10 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                {d.label}: {d.detail}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Vertical columns with a hover tooltip. Columns are capped at 24px and grow from the baseline.
export function ColumnChart({ data, height = 180, unit = "" }: { data: Datum[]; height?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(1, ...data.map((d) => d.value));
  const width = 600;
  const pad = { l: 36, r: 8, t: 12, b: 24 };
  const plotH = height - pad.t - pad.b;
  const band = (width - pad.l - pad.r) / Math.max(1, data.length);
  const barW = Math.min(24, band * 0.6);
  const ticks = niceTicks(top);
  const y = (v: number) => pad.t + plotH - (v / ticks[ticks.length - 1]) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Column chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill={INK_MUTED}>{t.toLocaleString("en-US")}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const x = cx - barW / 2;
          const top = y(d.value);
          const r = Math.min(4, h);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + band * i} y={pad.t} width={band} height={plotH} fill="transparent" />
              <path
                d={`M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z`}
                fill={BAR}
                opacity={hover !== null && hover !== i ? 0.55 : 1}
              />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize={10} fill={INK_MUTED}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${((pad.l + band * hover + band / 2) / width) * 100}%`, top: 0 }}
        >
          <span className="font-semibold">{data[hover].label}</span> · {fmt(data[hover].value, unit)}
          {data[hover].detail && <span className="text-slate-300"> · {data[hover].detail}</span>}
        </div>
      )}
    </div>
  );
}

// Single-series area over time with a crosshair and tooltip.
export function AreaChart({ data, height = 200 }: { data: Datum[]; height?: number }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const ticks = niceTicks(Math.max(1, ...data.map((d) => d.value)));
  const maxT = ticks[ticks.length - 1];
  const x = (i: number) => pad.l + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => pad.t + plotH - (v / maxT) * plotH;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const labelEvery = Math.ceil(data.length / 6);

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * plotW;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round((px / plotW) * (data.length - 1)))));
  }

  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-500">No data for this filter.</p>;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Area chart">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={BAR} stopOpacity={0.22} />
            <stop offset="100%" stopColor={BAR} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill={INK_MUTED}>{t.toLocaleString("en-US")}</text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={BAR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.label} x={x(i)} y={height - 8} textAnchor="middle" fontSize={10} fill={INK_MUTED}>{d.label}</text>
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke={INK_MUTED} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={5} fill={BAR} stroke="#fff" strokeWidth={2} />
          </g>
        )}
        <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(hover) / width) * 100}%` }}
        >
          <span className="font-semibold">{data[hover].label}</span> · {data[hover].value.toLocaleString("en-US")}
          {data[hover].detail && <span className="text-slate-300"> · {data[hover].detail}</span>}
        </div>
      )}
    </div>
  );
}

// A single ratio against a limit.
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-urblue-100" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-urblue" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function niceTicks(max: number) {
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => max / s <= 5) ?? step * 10;
  const ticks = [];
  for (let t = 0; t <= max + nice * 0.001; t += nice) ticks.push(Math.round(t));
  if (ticks[ticks.length - 1] < max) ticks.push(Math.round(ticks[ticks.length - 1] + nice));
  return ticks;
}
