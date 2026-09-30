import type { Category, Event, Venue } from "@/data/events";

import * as fake from "./fake-server";

/*
 * Backend contract. Until a real backend exists (EXPO_PUBLIC_API_URL unset), the built-in fake server answers.
 *   GET  {API}/events?updatedSince=<ISO>  -> Changes   (published + cancelled events changed since the cursor)
 *   POST {API}/submissions  (Submission, header Idempotency-Key: <id>)  -> 201   (stored as pending, F16)
 */

export type Changes = { serverTime: string; events: Event[]; venues: Venue[] };

export type Submission = {
  id: string; // client-generated; lets the server drop duplicate retries
  title: string;
  category: Category;
  startsAt: string;
  endsAt: string;
  venueName: string;
  neighbourhood: string;
  address: string;
  priceKes: number | null;
  description: string;
  link: string;
  contact: string; // moderators only, never shown in the app
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const TIMEOUT_MS = 15_000;

async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchChanges(updatedSince: string | null): Promise<Changes> {
  if (!API_URL) return fake.fetchChanges(updatedSince);
  const query = updatedSince ? `?updatedSince=${encodeURIComponent(updatedSince)}` : "";
  const res = await request(`/events${query}`, { headers: { Accept: "application/json" } });
  return (await res.json()) as Changes;
}

export async function submitEvent(submission: Submission): Promise<void> {
  if (!API_URL) return fake.submitEvent(submission);
  await request("/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": submission.id },
    body: JSON.stringify(submission),
  });
}
