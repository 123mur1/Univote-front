"use client";

// Prototype-only persistence in this browser's localStorage, with React subscriptions and
// cross-tab sync. The backend (univote-back) will replace these stores.

import { useSyncExternalStore } from "react";

export function createStore<T>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let cache: T | null = null;

  function read(): T {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : empty;
    } catch {
      cache = empty;
    }
    return cache;
  }

  // Throws if the browser refuses to store it (e.g. quota exceeded); the in-memory copy is unchanged then.
  function write(next: T) {
    localStorage.setItem(key, JSON.stringify(next));
    cache = next;
    listeners.forEach((l) => l());
  }

  function clear() {
    try {
      localStorage.removeItem(key);
    } catch {}
    cache = null;
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    read,
    write,
    clear,
    use: () => useSyncExternalStore(subscribe, read, () => empty),
  };
}

const noop = () => () => {};

// True only after hydration, so client-only state can render without mismatches.
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

// Current time, rounded to the minute so renders stay stable; updates every minute.
const readNow = () => Math.floor(Date.now() / 60_000) * 60_000;
function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
}

export function useNow() {
  return useSyncExternalStore(subscribeMinute, readNow, () => 0);
}
