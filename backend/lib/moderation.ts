import { and, asc, desc, eq, gt } from "drizzle-orm";

import type { Db } from "@/db";
import { events, submissions, venues } from "@/db/schema";

import type { ReviewInput } from "./contract";

export class ModerationError extends Error {}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Finds the venue by name and neighbourhood, updating its details, or creates it. Touching updatedAt pushes the change to phones. */
async function upsertVenue(tx: Tx, input: ReviewInput, now: Date) {
  const values = {
    name: input.venueName,
    neighbourhood: input.neighbourhood,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
  };
  const [venue] = await tx
    .insert(venues)
    .values({ ...values, updatedAt: now })
    .onConflictDoUpdate({ target: [venues.name, venues.neighbourhood], set: { address: values.address, lat: values.lat, lng: values.lng, updatedAt: now } })
    .returning();
  return venue;
}

function eventFields(input: ReviewInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    priceKes: input.priceKes,
    organiser: input.organiser,
    link: input.link,
  };
}

/** Publishes a pending submission as an event, with the admin's edits applied. */
export async function approveSubmission(db: Db, submissionId: string, input: ReviewInput, now = new Date()) {
  return db.transaction(async (tx) => {
    const [submission] = await tx.select().from(submissions).where(eq(submissions.id, submissionId)).for("update");
    if (!submission) throw new ModerationError("Submission not found.");
    if (submission.status !== "pending") throw new ModerationError(`This submission was already ${submission.status}.`);

    const venue = await upsertVenue(tx, input, now);
    const [event] = await tx
      .insert(events)
      .values({ ...eventFields(input), venueId: venue.id, status: "published", submissionId, createdAt: now, updatedAt: now })
      .returning();
    await tx.update(submissions).set({ status: "approved", eventId: event.id, reviewedAt: now }).where(eq(submissions.id, submissionId));
    return event;
  });
}

/** Turns a submission down with a short reason for the organiser. */
export async function rejectSubmission(db: Db, submissionId: string, reason: string, now = new Date()) {
  const trimmed = reason.trim();
  if (!trimmed) throw new ModerationError("Give the organiser a short reason.");
  const updated = await db
    .update(submissions)
    .set({ status: "rejected", rejectionReason: trimmed.slice(0, 500), reviewedAt: now })
    .where(and(eq(submissions.id, submissionId), eq(submissions.status, "pending")))
    .returning({ id: submissions.id });
  if (updated.length === 0) throw new ModerationError("This submission is no longer pending.");
}

/** Edits a published event; phones pick it up on their next sync and saved copies get a change alert (F13). */
export async function updateEvent(db: Db, eventId: string, input: ReviewInput, now = new Date()) {
  return db.transaction(async (tx) => {
    const venue = await upsertVenue(tx, input, now);
    const [event] = await tx
      .update(events)
      .set({ ...eventFields(input), venueId: venue.id, updatedAt: now })
      .where(eq(events.id, eventId))
      .returning();
    if (!event) throw new ModerationError("Event not found.");
    return event;
  });
}

/** Cancel (stays visible as cancelled, O9), restore, or unpublish (pending: removed from phones). */
export async function setEventStatus(db: Db, eventId: string, status: "published" | "cancelled" | "pending", now = new Date()) {
  const updated = await db.update(events).set({ status, updatedAt: now }).where(eq(events.id, eventId)).returning({ id: events.id });
  if (updated.length === 0) throw new ModerationError("Event not found.");
}

export function listPendingSubmissions(db: Db) {
  return db.select().from(submissions).where(eq(submissions.status, "pending")).orderBy(asc(submissions.createdAt));
}

export function listRecentlyReviewed(db: Db, limit = 10) {
  return db.select().from(submissions).where(gt(submissions.reviewedAt, new Date(0))).orderBy(desc(submissions.reviewedAt)).limit(limit);
}

export async function getSubmission(db: Db, id: string) {
  const [row] = await db.select().from(submissions).where(eq(submissions.id, id));
  return row ?? null;
}

/** Existing venue with this name and neighbourhood, to prefill coordinates when approving. */
export async function findVenue(db: Db, name: string, neighbourhood: string) {
  const [row] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.name, name.trim()), eq(venues.neighbourhood, neighbourhood.trim())));
  return row ?? null;
}

/** Events that haven't ended, soonest first, for the admin overview. */
export function listUpcomingEvents(db: Db, now = new Date()) {
  return db
    .select({ event: events, venue: venues })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(gt(events.endsAt, now))
    .orderBy(asc(events.startsAt));
}

export async function getEventWithVenue(db: Db, id: string) {
  const [row] = await db.select({ event: events, venue: venues }).from(events).innerJoin(venues, eq(events.venueId, venues.id)).where(eq(events.id, id));
  return row ?? null;
}
