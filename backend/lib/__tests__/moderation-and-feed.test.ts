import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getChanges, CURSOR_OVERLAP_MS } from "@/lib/feed";
import { approveSubmission, ModerationError, rejectSubmission, setEventStatus, updateEvent } from "@/lib/moderation";
import { createSubmission } from "@/lib/submissions";
import { getSubmission } from "@/lib/moderation";

import { reviewInput, submissionInput, testDb, wipe } from "./helpers";

const handle = await testDb();
const db = handle.db;

const T0 = new Date("2026-09-30T09:00:00Z"); // Wed noon in Nairobi
const later = (ms: number) => new Date(T0.getTime() + ms);

/** Submits and approves an event at `when`, returning the published row. */
async function publish(id: string, overrides: Parameters<typeof reviewInput>[0] = {}, when = T0) {
  await createSubmission(db, submissionInput({ id }));
  return approveSubmission(db, id, reviewInput(overrides), when);
}

beforeAll(() => {});
beforeEach(() => wipe(db));
afterAll(() => handle.close());

describe("submissions (F14, F16)", () => {
  it("stores a submission once, however many times the app retries", async () => {
    expect(await createSubmission(db, submissionInput())).toBe(true);
    expect(await createSubmission(db, submissionInput())).toBe(false);
    expect((await getSubmission(db, "sub-123456"))?.status).toBe("pending");
  });

  it("keeps pending submissions out of the feed", async () => {
    await createSubmission(db, submissionInput());
    expect((await getChanges(db, null, T0)).events).toEqual([]);
  });
});

describe("approving and rejecting", () => {
  it("publishes the admin's edited version and links it to the submission", async () => {
    const event = await publish("sub-aaaaaa", { title: "Open Mic (edited)", organiser: "Kona Collective" });
    expect(event).toMatchObject({ title: "Open Mic (edited)", status: "published", submissionId: "sub-aaaaaa" });
    expect(await getSubmission(db, "sub-aaaaaa")).toMatchObject({ status: "approved", eventId: event.id });
  });

  it("reuses a venue with the same name and neighbourhood, updating its details", async () => {
    const first = await publish("sub-aaaaaa");
    const second = await publish("sub-bbbbbb", { title: "Second night", address: "Ole Sangale Rd, gate B", lat: -1.31 });
    expect(second.venueId).toBe(first.venueId);

    const feed = await getChanges(db, null, T0);
    expect(feed.venues).toHaveLength(1);
    expect(feed.venues[0]).toMatchObject({ address: "Ole Sangale Rd, gate B", lat: -1.31 });
  });

  it("refuses to approve or reject the same submission twice", async () => {
    await publish("sub-aaaaaa");
    await expect(approveSubmission(db, "sub-aaaaaa", reviewInput())).rejects.toThrow(ModerationError);
    await expect(rejectSubmission(db, "sub-aaaaaa", "Duplicate")).rejects.toThrow(ModerationError);
  });

  it("needs a reason to reject, and records it", async () => {
    await createSubmission(db, submissionInput());
    await expect(rejectSubmission(db, "sub-123456", "   ")).rejects.toThrow(/reason/);
    await rejectSubmission(db, "sub-123456", "Private event");
    expect(await getSubmission(db, "sub-123456")).toMatchObject({ status: "rejected", rejectionReason: "Private event" });
  });
});

describe("GET /events feed (O2, O9)", () => {
  it("full sync: published and cancelled events, with their venues, but never organiser contacts", async () => {
    const a = await publish("sub-aaaaaa");
    const b = await publish("sub-bbbbbb", { title: "Cancelled one" });
    await setEventStatus(db, b.id, "cancelled", T0);

    const feed = await getChanges(db, null, T0);
    expect(feed.events.map((e) => [e.id, e.status]).sort()).toEqual([[a.id, "published"], [b.id, "cancelled"]].sort());
    expect(feed.venues.map((v) => v.id)).toEqual([a.venueId]);
    expect(JSON.stringify(feed)).not.toContain("organiser@example.com");
  });

  it("full sync skips events that ended over a week ago but keeps last week's for Past", async () => {
    const day = 86_400_000;
    await publish("sub-old000", { startsAt: new Date(T0.getTime() - 9 * day), endsAt: new Date(T0.getTime() - 8 * day) });
    const recent = await publish("sub-recent", { startsAt: new Date(T0.getTime() - 3 * day), endsAt: new Date(T0.getTime() - 2 * day) });
    expect((await getChanges(db, null, T0)).events.map((e) => e.id)).toEqual([recent.id]);
  });

  it("delta: only what changed since the cursor, including unpublished events so phones drop them", async () => {
    const keep = await publish("sub-aaaaaa", {}, T0);
    const pulled = await publish("sub-bbbbbb", { title: "Pulled" }, T0);
    const cursor = new Date((await getChanges(db, null, later(60_000))).serverTime);

    await setEventStatus(db, pulled.id, "pending", later(120_000));
    const delta = await getChanges(db, cursor, later(180_000));

    expect(delta.events.map((e) => [e.id, e.status])).toEqual([[pulled.id, "pending"]]);
    expect(delta.events.some((e) => e.id === keep.id)).toBe(false);
  });

  it("delta: an edited event comes back with its new time, ready for change alerts (F13)", async () => {
    const event = await publish("sub-aaaaaa", {}, T0);
    const cursor = later(60_000);
    const moved = new Date("2026-10-02T16:00:00.000Z");
    await updateEvent(db, event.id, reviewInput({ startsAt: moved }), later(120_000));

    const delta = await getChanges(db, cursor, later(180_000));
    expect(delta.events).toHaveLength(1);
    expect(delta.events[0].startsAt).toBe(moved.toISOString());
  });

  it("delta: a venue edit alone still reaches phones", async () => {
    await publish("sub-aaaaaa", {}, T0);
    const cursor = later(60_000);
    // Approving another event at the same venue updates the shared venue row.
    await publish("sub-bbbbbb", { address: "New entrance on Mbagathi Way" }, later(120_000));

    const delta = await getChanges(db, cursor, later(180_000));
    expect(delta.venues.map((v) => v.address)).toEqual(["New entrance on Mbagathi Way"]);
  });

  it("hands back a cursor slightly behind the clock so in-flight writes aren't missed", async () => {
    const now = later(10 * 60_000);
    expect((await getChanges(db, null, now)).serverTime).toBe(new Date(now.getTime() - CURSOR_OVERLAP_MS).toISOString());
  });
});
