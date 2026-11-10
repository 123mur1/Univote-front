import { endSession, readSession, updateSession, type ApiTokens } from "./session";

export const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function reportApiError(cause: unknown) {
  if (typeof window === "undefined") return;
  // An ended session is handled by redirecting to sign-in, not by an error banner.
  if (cause instanceof ApiError && cause.status === 401) return;
  const message = cause instanceof Error ? cause.message : "The backend request failed.";
  window.dispatchEvent(new CustomEvent("univote:api-error", { detail: message }));
}

// Renew this long before the access token expires, so requests never race the expiry.
const REFRESH_MARGIN_MS = 2 * 60_000;
let refreshing: Promise<string | null> | null = null;

// Exchanges the refresh token for a new access token. Concurrent callers share one request.
export function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const session = readSession();
  if (!session?.refreshToken) return Promise.resolve(null);
  refreshing = (async () => {
    try {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as ApiTokens;
      if (!body.accessToken) return null;
      updateSession({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken ?? session.refreshToken,
        accessExpiresAt: Date.now() + (body.expiresIn ?? 1800) * 1000,
        ...(body.user ? { name: body.user.name, email: body.user.email ?? undefined } : {}),
      });
      return body.accessToken;
    } catch {
      // Network failure: keep the session and let the caller report the outage.
      return session.accessToken ?? null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// Ends the local session and sends the user to sign in with an explanation.
export function expireSession(reason: "expired" | "revoked" = "expired") {
  if (typeof window === "undefined") return;
  const session = readSession();
  if (!session) return;
  // An impersonation that ran out returns the administrator to their own console.
  if (session.impersonator) {
    const { session: admin } = session.impersonator;
    endSession();
    window.localStorage.setItem("univote.active-session.v1", JSON.stringify({ ...admin, signedInAt: new Date().toISOString() }));
    window.location.assign("/admin/users?impersonation=ended");
    return;
  }
  endSession();
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?reason=${reason}&next=${next}`);
}

async function validToken(explicit?: string) {
  if (explicit) return explicit;
  const session = readSession();
  if (!session?.accessToken) return undefined;
  if (session.refreshToken && session.accessExpiresAt && session.accessExpiresAt - Date.now() < REFRESH_MARGIN_MS) {
    return (await refreshAccessToken()) ?? session.accessToken;
  }
  return session.accessToken;
}

async function send(path: string, init: RequestInit, token?: string) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(`${apiBase}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(`Cannot reach the UniVote server at ${apiBase}. Check that the backend is running.`, 0);
  }
}

// Sign-in and sign-up calls are anonymous: a stale token must not be sent or refreshed for them.
const ANONYMOUS_PATHS = ["/auth/login", "/auth/otp/", "/auth/students/", "/auth/refresh"];

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const anonymous = ANONYMOUS_PATHS.some((prefix) => path.startsWith(prefix));
  const sentToken = anonymous ? undefined : await validToken(token);
  let response = await send(path, init, sentToken);

  // The access token was rejected: renew it once and retry, otherwise the session is over.
  if (response.status === 401 && sentToken && !token) {
    const renewed = await refreshAccessToken();
    if (renewed && renewed !== sentToken) response = await send(path, init, renewed);
    if (response.status === 401) {
      expireSession("expired");
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
  }

  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new ApiError(message || `Request failed (${response.status}).`, response.status);
  }
  return body as T;
}
