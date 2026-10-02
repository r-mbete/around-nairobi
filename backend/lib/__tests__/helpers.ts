import { sql } from "drizzle-orm";

import { createDb, type Db } from "@/db";
import type { ReviewInput, SubmissionInput } from "@/lib/contract";

/** A fresh in-memory Postgres with the real migrations applied. */
export async function testDb() {
  const handle = createDb({ memory: true });
  await handle.migrate();
  return handle;
}

export async function wipe(db: Db) {
  await db.execute(sql`TRUNCATE submissions, events, venues CASCADE`);
}

export const submissionInput = (overrides: Partial<SubmissionInput> = {}): SubmissionInput => ({
  id: "sub-123456",
  title: "Open Mic Poetry",
  category: "Arts",
  startsAt: "2026-10-02T15:00:00.000Z",
  endsAt: "2026-10-02T18:00:00.000Z",
  venueName: "Kona Café",
  neighbourhood: "Madaraka",
  address: "Ole Sangale Road",
  priceKes: 300,
  description: "Poetry and stories.",
  link: "https://example.com/open-mic",
  contact: "organiser@example.com",
  ...overrides,
});

export const reviewInput = (overrides: Partial<ReviewInput> = {}): ReviewInput => ({
  title: "Open Mic Poetry",
  category: "Arts",
  startsAt: new Date("2026-10-02T15:00:00.000Z"),
  endsAt: new Date("2026-10-02T18:00:00.000Z"),
  venueName: "Kona Café",
  neighbourhood: "Madaraka",
  address: "Ole Sangale Road",
  lat: -1.3094,
  lng: 36.8134,
  organiser: "Kona Collective",
  priceKes: 300,
  description: "Poetry and stories.",
  link: "https://example.com/open-mic",
  ...overrides,
});
