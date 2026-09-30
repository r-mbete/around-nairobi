import * as Network from "expo-network";
import { AppState } from "react-native";

import { cache, type Cache, getEvent, isPrunable } from "@/data/cache";
import type { Event, Venue } from "@/data/events";
import { flushOutbox } from "@/data/outbox";
import { getSaved, onSavedEventChanged } from "@/data/saved";

import { type Changes, fetchChanges } from "./api";
import { createStore } from "./store";

export type SyncStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "failed"; retryAt: number | null };

export const syncStatus = createStore<SyncStatus>({ state: "idle" });
export const useSyncStatus = syncStatus.use;

const BACKOFF_MS = [30_000, 120_000, 600_000]; // O6
const FOREGROUND_REFRESH_MS = 15 * 60_000;

let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;

/** Merges a delta into the cache. The cursor only moves on success, so a dropped sync just repeats (O6). */
function applyChanges(prev: Cache, changes: Changes): Cache {
  const events: Record<string, Event> = { ...prev.events };
  const venues: Record<string, Venue> = { ...prev.venues };

  for (const v of changes.venues) venues[v.id] = v;
  for (const e of changes.events) {
    if (e.status === "pending") delete events[e.id]; // Unpublished upstream.
    else events[e.id] = e; // Cancelled events are kept and shown as cancelled (O9).
  }
  for (const [id, e] of Object.entries(events)) {
    if (isPrunable(e)) delete events[id];
  }
  return { events, venues, cursor: changes.serverTime, lastSyncedAt: Date.now() };
}

/** Fetches only what changed since the last sync (O2). Safe to call often; concurrent calls share one request. */
export function syncNow(): Promise<void> {
  inFlight ??= (async () => {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    syncStatus.set({ state: "syncing" });
    try {
      const before = cache.get();
      const changes = await fetchChanges(before.cursor);
      const after = applyChanges(before, changes);
      cache.set(after);
      failures = 0;
      syncStatus.set({ state: "idle" });
      void flushOutbox(); // The connection works, so anything queued can go too.

      // Tell people about saved events that moved or were cancelled (F13).
      const saved = getSaved();
      for (const e of changes.events) {
        const was = getEvent(before, e.id);
        const now = getEvent(after, e.id);
        if (saved[e.id] && was && now) await onSavedEventChanged(was, now);
      }
    } catch {
      const delay = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)];
      failures += 1;
      retryTimer = setTimeout(() => void syncNow(), delay);
      syncStatus.set({ state: "failed", retryAt: Date.now() + delay });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function syncAndFlush() {
  void syncNow();
  void flushOutbox();
}

/** Starts background syncing: once now, again on reconnect, and when the app returns after a while. */
export function startSync() {
  syncAndFlush();

  let wasOnline: boolean | null = null;
  const network = Network.addNetworkStateListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    if (online && wasOnline === false) syncAndFlush();
    wasOnline = online;
  });

  const appState = AppState.addEventListener("change", (s) => {
    const last = cache.get().lastSyncedAt ?? 0;
    if (s === "active" && Date.now() - last > FOREGROUND_REFRESH_MS) syncAndFlush();
  });

  return () => {
    network.remove();
    appState.remove();
    if (retryTimer) clearTimeout(retryTimer);
  };
}
