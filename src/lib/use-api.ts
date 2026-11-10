"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, reportApiError } from "./api-client";
import { useSession } from "./session";

// Fired after any change so every mounted view reloads its data.
export const DATA_CHANGED = "univote:data-changed";

export function notifyDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_CHANGED));
}

type Options = { pollMs?: number; silent?: boolean };

// Loads one API resource for the signed-in user and reloads it after changes. Pass null to skip.
export function useApi<T>(path: string | null, { pollMs, silent = false }: Options = {}) {
  const session = useSession();
  const userKey = session?.userId ?? session?.detail ?? "";
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: "" });
  const [tick, setTick] = useState(0);
  const key = path ? `${userKey}|${path}` : "";

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!path) return;
    let active = true;
    apiRequest<T>(path)
      .then((data) => { if (active) setState({ key, data }); })
      .catch((cause: unknown) => {
        if (!active) return;
        setState((previous) => ({ key, data: previous.key === key ? previous.data : undefined, error: cause instanceof Error ? cause.message : "Request failed." }));
        if (!silent) reportApiError(cause);
      });
    return () => { active = false; };
  }, [path, key, tick, silent]);

  useEffect(() => {
    if (!path) return;
    window.addEventListener(DATA_CHANGED, reload);
    const timer = pollMs ? window.setInterval(reload, pollMs) : undefined;
    return () => {
      window.removeEventListener(DATA_CHANGED, reload);
      if (timer) window.clearInterval(timer);
    };
  }, [path, pollMs, reload]);

  const current = state.key === key ? state : { key, data: undefined, error: undefined };
  return { data: current.data, error: current.error, loading: Boolean(path) && current.data === undefined && !current.error, reload };
}
