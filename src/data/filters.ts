import { useSyncExternalStore } from "react";

import { storage } from "@/lib/storage";

import { CATEGORIES, type Category, type ListedEvent, NEIGHBOURHOODS } from "./events";

export type Filters = { categories: Category[]; neighbourhoods: string[]; freeOnly: boolean };

const KEY = "filters.v1";
const EMPTY: Filters = { categories: [], neighbourhoods: [], freeOnly: false };

/** Reads saved filters, dropping values that no longer exist (e.g. a renamed neighbourhood). */
function load(): Filters {
  try {
    const saved = JSON.parse(storage.get(KEY) ?? "null") as Partial<Filters> | null;
    if (!saved) return EMPTY;
    return {
      categories: (saved.categories ?? []).filter((c) => (CATEGORIES as readonly string[]).includes(c)),
      neighbourhoods: (saved.neighbourhoods ?? []).filter((n) => NEIGHBOURHOODS.includes(n)),
      freeOnly: saved.freeOnly === true,
    };
  } catch {
    return EMPTY;
  }
}

let current = load();
const listeners = new Set<() => void>();

export function setFilters(next: Filters) {
  current = next;
  storage.set(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shared, persisted filter state (F4). */
export function useFilters() {
  return useSyncExternalStore(subscribe, () => current, () => current);
}

export function clearFilters() {
  setFilters(EMPTY);
}

export function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function activeFilterCount(f: Filters) {
  return f.categories.length + f.neighbourhoods.length + (f.freeOnly ? 1 : 0);
}

/** Filters combine with AND across groups and OR within a group (F4), plus text search on title, venue and organiser (F5). */
export function applyFilters(events: ListedEvent[], f: Filters, query = "") {
  const q = query.trim().toLowerCase();
  return events.filter(
    (e) =>
      (f.categories.length === 0 || f.categories.includes(e.category)) &&
      (f.neighbourhoods.length === 0 || f.neighbourhoods.includes(e.venue.neighbourhood)) &&
      (!f.freeOnly || e.priceKes === null) &&
      (q === "" || [e.title, e.venue.name, e.organiser].some((s) => s.toLowerCase().includes(q))),
  );
}
