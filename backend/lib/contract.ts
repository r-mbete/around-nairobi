import { z } from "zod";

import { CATEGORIES } from "@/db/schema";

// The wire format shared with the app. Keep in step with src/lib/api.ts and src/data/events.ts there.

export type ApiVenue = { id: string; name: string; neighbourhood: string; address: string; lat: number; lng: number };

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  startsAt: string;
  endsAt: string;
  venueId: string;
  priceKes: number | null;
  organiser: string;
  link: string;
  status: "pending" | "published" | "cancelled";
  updatedAt: string;
};

export type Changes = { serverTime: string; events: ApiEvent[]; venues: ApiVenue[] };

const webLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/\S+\.\S+/.test(v), "Must be a web link starting with http:// or https://");

const required = (max: number) => z.string().trim().min(1).max(max);

/** What POST /submissions accepts. Mirrors the checks the app's form already runs. */
export const submissionSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9-]{6,64}$/, "Invalid id"),
    title: required(80),
    category: z.enum(CATEGORIES),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    venueName: required(120),
    neighbourhood: required(80),
    address: required(200),
    priceKes: z.number().int().min(0).max(1_000_000).nullable(),
    description: required(1000),
    link: webLink,
    contact: required(200),
  })
  .refine((s) => Date.parse(s.endsAt) > Date.parse(s.startsAt), { path: ["endsAt"], message: "Must end after it starts" });

export type SubmissionInput = z.infer<typeof submissionSchema>;

/** What an admin confirms when approving a submission or editing an event. */
export const reviewSchema = z
  .object({
    title: required(80),
    category: z.enum(CATEGORIES),
    startsAt: z.date(),
    endsAt: z.date(),
    venueName: required(120),
    neighbourhood: required(80),
    address: required(200),
    lat: z.number().min(-1.5).max(-1.1), // Nairobi's rough bounding box catches swapped or mistyped coordinates
    lng: z.number().min(36.6).max(37.1),
    organiser: required(120),
    priceKes: z.number().int().min(0).max(1_000_000).nullable(),
    description: required(1000),
    link: webLink,
  })
  .refine((s) => s.endsAt > s.startsAt, { path: ["endsAt"], message: "Must end after it starts" });

export type ReviewInput = z.infer<typeof reviewSchema>;
