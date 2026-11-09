"use client";

import { useEffect, useState } from "react";
import type { Activity, ActivityType } from "./activity";
import { apiRequest } from "./api-client";
import { readSession } from "./session";

type ApiActivity = { id: string; actorLabel: string; actorRole: string; type: string; severity: string; detail: string; beforeValue?: string | null; afterValue?: string | null; occurredAt: string };

export function useApiActivity() {
  const [items, setItems] = useState<Activity[] | null>(null);
  const token = readSession()?.accessToken;
  useEffect(() => {
    if (!token) return;
    apiRequest<ApiActivity[]>("/audit/activity?take=500")
      .then((rows) => setItems(rows.map((row) => ({
        id: row.id, at: row.occurredAt, actor: row.actorLabel,
        role: row.actorRole === "STUDENT" ? "student" : row.actorRole === "ANONYMOUS" ? "anonymous" : row.actorRole === "ADMINISTRATOR" ? "admin" : "officer",
        type: row.type.toLowerCase() as ActivityType,
        severity: row.severity.toLowerCase() as Activity["severity"], detail: row.detail,
        before: row.beforeValue ?? undefined, after: row.afterValue ?? undefined,
      }))))
      .catch(() => setItems(null));
  }, [token]);
  return items;
}
