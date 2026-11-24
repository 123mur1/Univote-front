"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-client";

export function ApiConnectionNotice() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const onApiError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setMessage(`Backend request failed: ${detail}`);
    };
    window.addEventListener("univote:api-error", onApiError);
    fetch(`${apiBase}/health`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Health check returned ${response.status}.`);
      })
      .catch(() => {
        if (active) setMessage(`Backend unavailable at ${apiBase}. Start the API and check its configuration.`);
      });
    return () => {
      active = false;
      window.removeEventListener("univote:api-error", onApiError);
    };
  }, []);

  if (!message) return null;
  return (
    <div role="alert" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg">
      {message}
    </div>
  );
}
