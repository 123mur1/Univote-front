"use client";

import { apiRequest } from "./api-client";
import { endSession, homeFor, readSession, sessionFromAuth, startSession, type ApiTokens, type ApiUser } from "./session";

// The administrator opens another user's account to help them. The administrator's own session
// is kept aside and restored when they leave; the backend records both events.
export async function signInAs(userId: string) {
  const admin = readSession();
  if (!admin || admin.role !== "admin" || admin.impersonator) throw new Error("Only a signed-in administrator can do this.");
  const response = await apiRequest<ApiTokens & { accessToken: string; user: ApiUser }>(`/auth/impersonate/${userId}`, { method: "POST" });
  const { impersonator: _none, ...adminSession } = admin;
  void _none;
  const next = sessionFromAuth(response);
  startSession({ ...next, impersonator: { name: admin.name, email: admin.email, session: adminSession } });
  window.location.assign(homeFor(next.role));
}

export async function returnToAdmin() {
  const session = readSession();
  if (!session?.impersonator) return;
  try {
    await apiRequest("/auth/impersonation/stop", { method: "POST" });
  } catch {
    /* The administrator still returns to their account if this audit call fails. */
  }
  const { signedInAt: _at, ...admin } = session.impersonator.session;
  void _at;
  endSession();
  startSession(admin);
  window.location.assign("/admin/users");
}
