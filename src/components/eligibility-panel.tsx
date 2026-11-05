import type { Check } from "@/lib/registry";
import { CheckCircleIcon, XIcon } from "./icons";

export function EligibilityList({ checks, compact = false }: { checks: Check[]; compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2.5 text-sm">
          {c.pass ? (
            <CheckCircleIcon width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <XIcon width={18} height={18} className="mt-0.5 shrink-0 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${c.pass ? "text-slate-800" : "text-red-700"}`}>{c.label}</p>
            {!compact && <p className="text-xs text-slate-500">{c.detail}</p>}
            {compact && !c.pass && <p className="text-xs text-slate-500">{c.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
