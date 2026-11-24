import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ElectionStatus } from "@/lib/data";

<<<<<<< HEAD
/* ------------------------------------------------------------------------------------------------
 * Buttons & form controls
 * ----------------------------------------------------------------------------------------------*/

const btnBase =
  "univote-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

export const btn = {
  primary: `${btnBase} bg-urblue text-white shadow-[0_8px_20px_-10px_rgba(0,98,139,.85)] hover:-translate-y-0.5 hover:bg-urblue-dark hover:shadow-[0_14px_28px_-12px_rgba(0,98,139,.9)] focus-visible:outline-urblue`,
  secondary: `${btnBase} border border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgba(11,34,48,.05)] hover:-translate-y-0.5 hover:border-urblue-300 hover:bg-urblue-25 hover:text-urblue hover:shadow-md focus-visible:outline-urblue`,
  ghost: `${btnBase} text-slate-600 hover:bg-urblue-50 hover:text-urblue focus-visible:outline-urblue`,
  danger: `${btnBase} bg-red-600 text-white shadow-[0_8px_20px_-10px_rgba(220,38,38,.8)] hover:-translate-y-0.5 hover:bg-red-700 focus-visible:outline-red-600`,
  inverse: `${btnBase} bg-white text-urblue shadow-[0_10px_30px_-12px_rgba(0,0,0,.45)] hover:-translate-y-0.5 hover:bg-urblue-50 focus-visible:outline-white`,
  ghostInverse: `${btnBase} border border-white/30 bg-white/5 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15 focus-visible:outline-white`,
};

export const input =
  "block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(11,34,48,.04)] transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-urblue focus:outline-none focus:ring-4 focus:ring-urblue/10 disabled:cursor-not-allowed disabled:bg-slate-50";

export const label = "mb-1.5 block text-sm font-semibold text-slate-700";

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

/* ------------------------------------------------------------------------------------------------
 * Surfaces
 * ----------------------------------------------------------------------------------------------*/
=======
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
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
<<<<<<< HEAD
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(11,34,48,.04),0_12px_32px_-24px_rgba(11,34,48,.35)] ${className}`}>
=======
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      {children}
    </div>
  );
}

<<<<<<< HEAD
// A card with a titled header row, the standard container for dashboard panels.
export function Panel({
  title,
  description,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        {icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-urblue-50 text-urblue">{icon}</span>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold text-slate-900">{title}</h2>
          {description && <p className="truncate text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
export function PageHeader({
  title,
  description,
  actions,
<<<<<<< HEAD
  eyebrow,
  icon,
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
<<<<<<< HEAD
  eyebrow?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && (
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-urblue to-urblue-darker text-white shadow-[var(--shadow-brand)] sm:flex">
            {icon}
          </span>
        )}
        <div>
          {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-urblue">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
=======
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
    </div>
  );
}

<<<<<<< HEAD
export function EmptyState({
  icon,
  title,
  text,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-2xl border border-dashed border-urblue-200 bg-urblue-25 px-6 py-10 text-center ${className}`}>
      {icon && (
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white text-urblue shadow-sm ring-1 ring-urblue-100">
          {icon}
        </span>
      )}
      <p className="mt-4 font-bold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`univote-skeleton rounded-xl ${className}`} />;
}

export function Callout({
  tone = "info",
  icon,
  title,
  children,
  className = "",
}: {
  tone?: "info" | "success" | "warning" | "danger";
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-urblue-100 bg-urblue-50/70 text-urblue-darker",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${tones[tone]} ${className}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Process: steppers
 * ----------------------------------------------------------------------------------------------*/

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="Progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                done ? "bg-urblue text-white" : active ? "bg-white text-urblue ring-2 ring-urblue shadow-[0_0_0_5px_rgba(0,98,139,.12)]" : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              ) : (
                index + 1
              )}
            </span>
            <span className={`hidden truncate text-xs font-semibold sm:block ${active ? "text-slate-900" : done ? "text-urblue" : "text-slate-400"}`}>{step}</span>
            {index < steps.length - 1 && (
              <span className="h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full bg-urblue transition-all duration-500" style={{ width: done ? "100%" : "0%" }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Status & badges
 * ----------------------------------------------------------------------------------------------*/

const statusStyles: Record<ElectionStatus, { label: string; className: string; dot: string }> = {
  open: { label: "Voting open", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  upcoming: { label: "Upcoming", className: "bg-urblue-50 text-urblue-dark ring-urblue-200", dot: "bg-urblue-400" },
  closed: { label: "Closed · counting", className: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  published: { label: "Results published", className: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-500" },
};

export function StatusBadge({ status }: { status: ElectionStatus }) {
  const s = statusStyles[status] ?? statusStyles.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.className}`}>
      <span className={`relative size-1.5 rounded-full ${s.dot} ${status === "open" ? "univote-ping text-emerald-500" : ""}`} />
=======
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
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
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
<<<<<<< HEAD
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
=======
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      {children}
    </span>
  );
}

<<<<<<< HEAD
/* ------------------------------------------------------------------------------------------------
 * Metrics
 * ----------------------------------------------------------------------------------------------*/

=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
<<<<<<< HEAD
  tone = "plain",
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  href?: string;
<<<<<<< HEAD
  tone?: "plain" | "brand" | "action";
}) {
  const brand = tone === "brand";
  const card = (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
        brand
          ? "border-transparent bg-gradient-to-br from-urblue via-urblue-dark to-urblue-darker text-white shadow-[var(--shadow-brand)]"
          : tone === "action"
            ? "border-urblue bg-white shadow-[0_0_0_4px_rgba(0,98,139,.08)]"
            : "border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(11,34,48,.04),0_12px_32px_-24px_rgba(11,34,48,.35)]"
      } ${href ? "group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]" : ""} ${href && !brand ? "group-hover:border-urblue-300" : ""}`}
    >
      {brand && <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full border-2 border-dashed border-white/15" />}
      <div className="relative flex items-start justify-between gap-3">
        <p className={`text-[13px] font-semibold ${brand ? "text-urblue-100" : "text-slate-500"}`}>{label}</p>
        {icon && (
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${brand ? "bg-white/15 text-white" : tone === "action" ? "bg-urblue text-white" : "bg-urblue-50 text-urblue"}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`relative mt-2 text-3xl font-extrabold tracking-tight tabular-nums ${brand ? "text-white" : "text-slate-900"}`}>{value}</p>
      {hint && <p className={`relative mt-1 text-xs ${brand ? "text-urblue-100/90" : "text-slate-500"}`}>{hint}</p>}
      {href && (
        <span className={`absolute bottom-4 right-4 text-sm opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 ${brand ? "text-white" : "text-urblue"}`} aria-hidden="true">→</span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue" aria-label={`${label}: ${value}. ${hint ?? "View details"}`}>
      {card}
    </Link>
  ) : (
    card
  );
}

export function ProgressBar({ value, max, tone = "brand", size = "md" }: { value: number; max: number; tone?: "brand" | "success" | "muted"; size?: "sm" | "md" | "lg" }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 1000) / 10);
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  const fills = { brand: "bg-gradient-to-r from-urblue-400 to-urblue", success: "bg-gradient-to-r from-emerald-400 to-emerald-600", muted: "bg-slate-400" };
  return (
    <div
      className={`${heights[size]} w-full overflow-hidden rounded-full bg-urblue-100/70`}
=======
}) {
  const card = (
    <Card className={`p-5 ${href ? "transition group-hover:border-urblue-300 group-hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && <span className="rounded-lg bg-urblue-50 p-2 text-urblue">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue" aria-label={`${label}: ${value}. ${hint ?? "View details"}`}>{card}</Link> : card;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 1000) / 10;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-urblue-100"
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
<<<<<<< HEAD
      <div className={`h-full rounded-full ${fills[tone]} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Circular progress, used for turnout and ballot completion.
export function Ring({ value, max, size = 64, stroke = 7, label }: { value: number; max: number; size?: number; stroke?: number; label?: ReactNode }) {
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-urblue-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="text-urblue transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-slate-900">{label ?? `${Math.round(pct * 100)}%`}</span>
=======
      <div className="h-full rounded-full bg-urblue" style={{ width: `${pct}%` }} />
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
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
<<<<<<< HEAD
    .filter(Boolean)
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

<<<<<<< HEAD
/* ------------------------------------------------------------------------------------------------
 * People
 * ----------------------------------------------------------------------------------------------*/

=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-14 text-base" };
  return (
    <span
<<<<<<< HEAD
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-urblue-100 to-urblue-200 font-bold text-urblue-darker ring-2 ring-white ${sizes[size]}`}
=======
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-urblue-100 font-semibold text-urblue-dark ${sizes[size]}`}
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
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
<<<<<<< HEAD
        className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-urblue-100 to-urblue-200 font-bold text-urblue-darker ${className}`}
=======
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-urblue-100 font-semibold text-urblue-dark ${className}`}
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
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
<<<<<<< HEAD
      className={`shrink-0 rounded-2xl object-cover ring-1 ring-urblue-100 ${className}`}
=======
      className={`shrink-0 rounded-xl object-cover ring-1 ring-urblue-100 ${className}`}
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      style={{ width: px, height: px }}
    />
  );
}

export function HashText({ value, size = 10 }: { value: string; size?: number }) {
  return (
<<<<<<< HEAD
    <code className="rounded-md bg-urblue-50 px-1.5 py-0.5 font-mono text-xs text-urblue-dark ring-1 ring-inset ring-urblue-100" title={value}>
=======
    <code className="rounded bg-urblue-50 px-1.5 py-0.5 font-mono text-xs text-urblue-dark" title={value}>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      {value.slice(0, size)}…{value.slice(-4)}
    </code>
  );
}
