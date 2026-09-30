import { createStore } from "@/lib/store";

import { CATEGORIES, type Category, type ListedEvent } from "./events";

export type Filters = { categories: Category[]; neighbourhoods: string[]; freeOnly: boolean };

const EMPTY: Filters = { categories: [], neighbourhoods: [], freeOnly: false };

/** Shared, persisted filter state (F4). */
const filters = createStore<Filters>(EMPTY, {
  key: "filters.v1",
  revive: (saved) => {
    const s = (saved ?? {}) as Partial<Filters>;
    return {
      categories: (s.categories ?? []).filter((c) => (CATEGORIES as readonly string[]).includes(c)),
      neighbourhoods: Array.isArray(s.neighbourhoods) ? s.neighbourhoods : [],
      freeOnly: s.freeOnly === true,
    };
  },
});

export const useFilters = filters.use;
export const setFilters = filters.set;

export function clearFilters() {
  filters.set(EMPTY);
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
