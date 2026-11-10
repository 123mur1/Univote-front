"use client";

import type { Activity, ActivityType } from "./activity";
import { useSession } from "./session";
import { useApi } from "./use-api";

type ApiActivity = { id: string; actorLabel: string; actorRole: string; type: string; severity: string; detail: string; beforeValue?: string | null; afterValue?: string | null; occurredAt: string };

function mapRole(role: string): Activity["role"] {
  if (role === "STUDENT") return "student";
  if (role === "ANONYMOUS") return "anonymous";
  if (role === "ADMINISTRATOR") return "admin";
  return "officer";
}

// The server's security and activity log (administrators only). Null while loading.
export function useApiActivity(): Activity[] | null {
  const session = useSession();
  const { data } = useApi<ApiActivity[]>(session?.role === "admin" ? "/audit/activity?take=500" : null, { pollMs: 60_000 });
  if (!data) return null;
  return data.map((row) => ({
    id: row.id,
    at: row.occurredAt,
    actor: row.actorLabel,
    role: mapRole(row.actorRole),
    type: row.type.toLowerCase() as ActivityType,
    severity: row.severity.toLowerCase() as Activity["severity"],
    detail: row.detail,
    before: row.beforeValue ?? undefined,
    after: row.afterValue ?? undefined,
  }));
}
