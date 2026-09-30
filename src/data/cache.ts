import { createStore } from "@/lib/store";

import { DAY_MS, type Event, type ListedEvent, type Venue } from "./events";

export type Cache = {
  events: Record<string, Event>;
  venues: Record<string, Venue>;
  /** Server clock of the last successful sync; sent back as `updatedSince` (O2). */
  cursor: string | null;
  /** Device clock of the last successful sync, for "Updated 3 h ago" (O5). */
  lastSyncedAt: number | null;
};

const EMPTY: Cache = { events: {}, venues: {}, cursor: null, lastSyncedAt: null };

/** The week's listings on this phone. Screens only ever read from here, never the network. */
export const cache = createStore<Cache>(EMPTY, {
  key: "cache.v1",
  revive: (saved) => ({ ...EMPTY, ...(saved as Partial<Cache>) }),
});

export const useCache = cache.use;

function join(c: Cache, e: Event): ListedEvent | null {
  const venue = c.venues[e.venueId];
  return venue ? { ...e, venue } : null;
}

/** Published and cancelled events that haven't ended yet (O9, F17). */
export function listEvents(c: Cache, now = Date.now()): ListedEvent[] {
  return Object.values(c.events)
    .filter((e) => e.status !== "pending" && Date.parse(e.endsAt) > now)
    .map((e) => join(c, e))
    .filter((e): e is ListedEvent => e !== null);
}

export function getEvent(c: Cache, id: string): ListedEvent | null {
  const e = c.events[id];
  return e && e.status !== "pending" ? join(c, e) : null;
}

export function neighbourhoods(c: Cache) {
  return [...new Set(Object.values(c.venues).map((v) => v.neighbourhood))].sort();
}

/** Keeps events for 7 days after they end so saved ones can show under "Past" (F17). */
export function isPrunable(e: Event, now = Date.now()) {
  return Date.parse(e.endsAt) < now - 7 * DAY_MS;
}
