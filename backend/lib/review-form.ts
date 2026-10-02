import type { EventRow, SubmissionRow, VenueRow } from "@/db/schema";

import { type ReviewInput, reviewSchema } from "./contract";
import { fromEatInput, toEatInput } from "./time";

/** Form values as strings, the way the admin form holds them. Times are Nairobi datetime-local values. */
export type ReviewValues = {
  title: string;
  category: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  neighbourhood: string;
  address: string;
  lat: string;
  lng: string;
  organiser: string;
  price: string; // blank = free
  description: string;
  link: string;
};

export type FormState = { error?: string; fields?: Partial<Record<keyof ReviewValues, string>>; values?: ReviewValues };

const KEYS: (keyof ReviewValues)[] = ["title", "category", "startsAt", "endsAt", "venueName", "neighbourhood", "address", "lat", "lng", "organiser", "price", "description", "link"];

export function readValues(form: FormData): ReviewValues {
  return Object.fromEntries(KEYS.map((k) => [k, String(form.get(k) ?? "")])) as ReviewValues;
}

const toNumber = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));

/** Validates the admin form; returns the parsed input or a message per field. */
export function parseReview(values: ReviewValues): { ok: true; data: ReviewInput } | { ok: false; state: FormState } {
  const price = values.price.trim();
  const candidate = {
    ...values,
    startsAt: fromEatInput(values.startsAt) ?? new Date(Number.NaN),
    endsAt: fromEatInput(values.endsAt) ?? new Date(Number.NaN),
    lat: toNumber(values.lat),
    lng: toNumber(values.lng),
    priceKes: price === "" ? null : /^\d+$/.test(price) ? Number(price) : Number.NaN,
  };
  const parsed = reviewSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, data: parsed.data };

  const fields: FormState["fields"] = {};
  for (const issue of parsed.error.issues) {
    const key = (issue.path[0] === "priceKes" ? "price" : issue.path[0]) as keyof ReviewValues;
    fields[key] ??= friendly(key, issue.message);
  }
  // Zod skips the object-level "ends after it starts" check while other fields fail; report it alongside them.
  const { startsAt, endsAt } = candidate;
  if (!fields.endsAt && !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && endsAt <= startsAt) {
    fields.endsAt = "Must end after it starts";
  }
  return { ok: false, state: { error: "Fix the highlighted fields.", fields, values } };
}

function friendly(key: keyof ReviewValues, fallback: string) {
  if (key === "lat" || key === "lng") return "Enter coordinates inside Nairobi (copy them from Google Maps).";
  if (key === "startsAt" || key === "endsAt") return fallback.includes("after") ? fallback : "Pick a date and time.";
  if (key === "price") return "Whole shillings, or leave blank for free.";
  return fallback;
}

/** Prefills the form from a submission, using an existing venue's coordinates when the name matches. */
export function valuesFromSubmission(s: SubmissionRow, venue: VenueRow | null): ReviewValues {
  return {
    title: s.title,
    category: s.category,
    startsAt: toEatInput(s.startsAt),
    endsAt: toEatInput(s.endsAt),
    venueName: s.venueName,
    neighbourhood: s.neighbourhood,
    address: venue?.address ?? s.address,
    lat: venue ? String(venue.lat) : "",
    lng: venue ? String(venue.lng) : "",
    organiser: s.venueName,
    price: s.priceKes === null ? "" : String(s.priceKes),
    description: s.description,
    link: s.link,
  };
}

export function valuesFromEvent(e: EventRow, v: VenueRow): ReviewValues {
  return {
    title: e.title,
    category: e.category,
    startsAt: toEatInput(e.startsAt),
    endsAt: toEatInput(e.endsAt),
    venueName: v.name,
    neighbourhood: v.neighbourhood,
    address: v.address,
    lat: String(v.lat),
    lng: String(v.lng),
    organiser: e.organiser,
    price: e.priceKes === null ? "" : String(e.priceKes),
    description: e.description,
    link: e.link,
  };
}
