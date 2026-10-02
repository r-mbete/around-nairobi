import { and, gt, inArray, ne, or } from "drizzle-orm";

import type { Db } from "@/db";
import { events, type EventRow, venues, type VenueRow } from "@/db/schema";

import type { ApiEvent, ApiVenue, Changes } from "./contract";

const DAY_MS = 86_400_000;

/**
 * The cursor handed back is a little behind the clock, so a write committing while this query runs
 * is picked up next time rather than missed. Re-sending a few rows is harmless: the app upserts by id.
 */
export const CURSOR_OVERLAP_MS = 30_000;

function toApiEvent(e: EventRow): ApiEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    venueId: e.venueId,
    priceKes: e.priceKes,
    organiser: e.organiser,
    link: e.link,
    status: e.status,
    updatedAt: e.updatedAt.toISOString(),
  };
}

function toApiVenue(v: VenueRow): ApiVenue {
  return { id: v.id, name: v.name, neighbourhood: v.neighbourhood, address: v.address, lat: v.lat, lng: v.lng };
}

/**
 * GET /events (O2).
 * - No cursor: every listed event that hasn't been over for a week (the app keeps a week of "Past").
 * - With a cursor: every event or venue edited since, including ones pulled back to pending, so the app can drop them.
 */
export async function getChanges(db: Db, since: Date | null, now = new Date()): Promise<Changes> {
  const changed = since
    ? await db.select().from(events).where(gt(events.updatedAt, since))
    : await db
        .select()
        .from(events)
        .where(and(ne(events.status, "pending"), gt(events.endsAt, new Date(now.getTime() - 7 * DAY_MS))));

  const venueIds = [...new Set(changed.map((e) => e.venueId))];
  const venueFilter = since
    ? venueIds.length
      ? or(inArray(venues.id, venueIds), gt(venues.updatedAt, since))
      : gt(venues.updatedAt, since)
    : venueIds.length
      ? inArray(venues.id, venueIds)
      : undefined;
  const changedVenues = venueFilter ? await db.select().from(venues).where(venueFilter) : [];

  return {
    serverTime: new Date(now.getTime() - CURSOR_OVERLAP_MS).toISOString(),
    events: changed.map(toApiEvent),
    venues: changedVenues.map(toApiVenue),
  };
}
