import { readSession } from "./session";

export const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

export function reportApiError(cause: unknown) {
  if (typeof window !== "undefined") {
    const message = cause instanceof Error ? cause.message : "The backend request failed.";
    window.dispatchEvent(new CustomEvent("univote:api-error", { detail: message }));
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const accessToken = token ?? readSession()?.accessToken;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${apiBase}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return body as T;
}
