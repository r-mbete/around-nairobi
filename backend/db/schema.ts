import { doublePrecision, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { CATEGORIES } from "../lib/categories";

export { CATEGORIES };

export const category = pgEnum("category", CATEGORIES);
export const eventStatus = pgEnum("event_status", ["pending", "published", "cancelled"]);
export const submissionStatus = pgEnum("submission_status", ["pending", "approved", "rejected"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** A place, entered once and shared by its events. */
export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    neighbourhood: text("neighbourhood").notNull(),
    address: text("address").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("venues_name_neighbourhood").on(t.name, t.neighbourhood), index("venues_updated_at").on(t.updatedAt)],
);

/** Approved listings. Only these ever reach the app. */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 80 }).notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    category: category("category").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    priceKes: integer("price_kes"), // null = free
    organiser: text("organiser").notNull(),
    link: text("link").notNull(),
    imageUrl: text("image_url"),
    status: eventStatus("status").notNull().default("published"),
    submissionId: text("submission_id"),
    ...timestamps,
  },
  (t) => [index("events_updated_at").on(t.updatedAt), index("events_ends_at").on(t.endsAt)],
);

/** What organisers send from the app. Kept apart from events so contact details never leave the server. */
export const submissions = pgTable(
  "submissions",
  {
    id: text("id").primaryKey(), // client-generated, doubles as the idempotency key
    title: varchar("title", { length: 80 }).notNull(),
    category: category("category").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    venueName: text("venue_name").notNull(),
    neighbourhood: text("neighbourhood").notNull(),
    address: text("address").notNull(),
    priceKes: integer("price_kes"),
    description: varchar("description", { length: 1000 }).notNull(),
    link: text("link").notNull(),
    contact: text("contact").notNull(),
    status: submissionStatus("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    eventId: uuid("event_id").references(() => events.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("submissions_status_created").on(t.status, t.createdAt)],
);

export type VenueRow = typeof venues.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type SubmissionRow = typeof submissions.$inferSelect;
