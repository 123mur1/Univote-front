import type { ReactNode } from "react";
import Image from "next/image";
import type { ElectionStatus } from "@/lib/data";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-urblue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-urblue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-urblue-200 bg-white px-4 py-2.5 text-sm font-semibold text-urblue transition hover:bg-urblue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue disabled:cursor-not-allowed disabled:opacity-50",
  inverse:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-urblue shadow-sm transition hover:bg-urblue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  ghostInverse:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10",
};

export const input =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-slate-400 focus:border-urblue focus:outline-none focus:ring-2 focus:ring-urblue/20";

export const label = "mb-1.5 block text-sm font-medium text-slate-700";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

const statusStyles: Record<ElectionStatus, { label: string; className: string }> = {
  open: { label: "Voting open", className: "bg-urblue text-white" },
  upcoming: { label: "Upcoming", className: "bg-urblue-100 text-urblue-dark" },
  closed: { label: "Closed · counting", className: "bg-slate-100 text-slate-700" },
  published: { label: "Results published", className: "bg-emerald-50 text-emerald-700" },
};

export function StatusBadge({ status }: { status: ElectionStatus }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      {status === "open" && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
      {s.label}
    </span>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "red" | "amber" | "gray";
}) {
  const tones = {
    blue: "bg-urblue-50 text-urblue-dark ring-urblue-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    gray: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && <span className="rounded-lg bg-urblue-50 p-2 text-urblue">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 1000) / 10;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-urblue-100"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-urblue" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function percent(value: number, total: number) {
  return total === 0 ? "0%" : `${((value / total) * 100).toFixed(1)}%`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-14 text-base" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-urblue-100 font-semibold text-urblue-dark ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}

const photoSizes = { sm: 32, md: 44, lg: 64, xl: 96 } as const;

export function CandidatePhoto({
  name,
  photo,
  size = "md",
  className = "",
}: {
  name: string;
  photo?: string;
  size?: keyof typeof photoSizes;
  className?: string;
}) {
  const px = photoSizes[size];
  if (!photo) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-urblue-100 font-semibold text-urblue-dark ${className}`}
        style={{ width: px, height: px, fontSize: px / 3 }}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <Image
      src={photo}
      alt={`Photo of ${name}`}
      width={px}
      height={px}
      // Uploaded photos are blob:/data: URLs, which the image optimizer can't fetch.
      unoptimized={photo.startsWith("blob:") || photo.startsWith("data:")}
      className={`shrink-0 rounded-xl object-cover ring-1 ring-urblue-100 ${className}`}
      style={{ width: px, height: px }}
    />
  );
}

export function HashText({ value, size = 10 }: { value: string; size?: number }) {
  return (
    <code className="rounded bg-urblue-50 px-1.5 py-0.5 font-mono text-xs text-urblue-dark" title={value}>
      {value.slice(0, size)}…{value.slice(-4)}
    </code>
  );
}
