import type { Submission } from "@/lib/api";

import { type Category, DAY_MS, eatDateTime, eatDayStart, parseHhmm } from "./events";

export type Form = {
  title: string;
  category: Category | null;
  dayOffset: number | null;
  start: string;
  end: string;
  venueName: string;
  neighbourhood: string;
  address: string;
  free: boolean;
  price: string;
  description: string;
  link: string;
  contact: string;
};

export const BLANK: Form = {
  title: "",
  category: null,
  dayOffset: null,
  start: "",
  end: "",
  venueName: "",
  neighbourhood: "",
  address: "",
  free: true,
  price: "",
  description: "",
  link: "",
  contact: "",
};

export type Errors = Partial<Record<keyof Form, string>>;

/** Checks an organiser submission; returns a message per field that needs fixing (F14). */
export function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = "Add a title.";
  else if (f.title.length > 80) e.title = "Keep the title under 80 characters.";
  if (!f.category) e.category = "Pick a category.";
  if (f.dayOffset === null) e.dayOffset = "Pick a date.";
  const start = parseHhmm(f.start);
  const end = parseHhmm(f.end);
  if (start === null) e.start = "Use 24-hour time, like 19:30.";
  if (f.end && end === null) e.end = "Use 24-hour time, like 22:00.";
  if (!f.venueName.trim()) e.venueName = "Add the venue name.";
  if (!f.neighbourhood.trim()) e.neighbourhood = "Add the neighbourhood.";
  if (!f.address.trim()) e.address = "Add a street or landmark so people can find it.";
  if (!f.free && !/^\d+$/.test(f.price.trim())) e.price = "Enter the price in KES, numbers only.";
  if (!f.description.trim()) e.description = "Tell people what to expect.";
  else if (f.description.length > 1000) e.description = "Keep it under 1,000 characters.";
  if (!/^https?:\/\/\S+\.\S+/.test(f.link.trim())) e.link = "Add a link starting with https://";
  if (!f.contact.trim()) e.contact = "Add a phone number or email so we can reach you.";
  return e;
}

/** Turns a valid form into the payload sent to the server. */
export function toSubmission(f: Form, now = new Date()): Submission {
  const day = eatDayStart(f.dayOffset ?? 0, now);
  const startsAt = eatDateTime(day, f.start);
  const startMin = parseHhmm(f.start) ?? 0;
  const endMin = f.end ? parseHhmm(f.end) : null;
  // No end time: assume 2 hours. An end before the start means it runs past midnight.
  const endsAt =
    endMin === null
      ? new Date(Date.parse(startsAt) + 2 * 60 * 60 * 1000).toISOString()
      : eatDateTime(endMin <= startMin ? day + DAY_MS : day, f.end);

  return {
    id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    title: f.title.trim(),
    category: f.category ?? "Community",
    startsAt,
    endsAt,
    venueName: f.venueName.trim(),
    neighbourhood: f.neighbourhood.trim(),
    address: f.address.trim(),
    priceKes: f.free ? null : Number(f.price),
    description: f.description.trim(),
    link: f.link.trim(),
    contact: f.contact.trim(),
  };
}
