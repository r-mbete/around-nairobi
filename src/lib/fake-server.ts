import * as Network from "expo-network";

import { DAY_MS, eatDateTime, eatDayStart, type Event, type Venue } from "@/data/events";

import type { Changes, Submission } from "./api";
import { storage } from "./storage";

// Stand-in backend for development. The sample week is pinned to a stored start day so data stays
// stable like a real server's, and is re-published every few days so the list never runs dry.

const ANCHOR_KEY = "fake-server.anchor";
const REFRESH_AFTER_DAYS = 4;

function loadAnchor(): { day: number; publishedAt: string } {
  try {
    const saved = JSON.parse(storage.get(ANCHOR_KEY) ?? "null") as { day: number; publishedAt: string } | null;
    if (saved && eatDayStart() - saved.day < REFRESH_AFTER_DAYS * DAY_MS) return saved;
  } catch {}
  const fresh = { day: eatDayStart(), publishedAt: new Date().toISOString() };
  storage.set(ANCHOR_KEY, JSON.stringify(fresh));
  return fresh;
}

const anchor = loadAnchor();
const publishedAt = anchor.publishedAt;

function at(dayOffset: number, hhmm: string) {
  return eatDateTime(anchor.day + dayOffset * DAY_MS, hhmm);
}

const VENUES: Venue[] = [
  { id: "v1", name: "The Blue Room", neighbourhood: "Westlands", address: "Woodvale Grove, Westlands", lat: -1.2641, lng: 36.8029 },
  { id: "v2", name: "Riverside Grounds", neighbourhood: "Kilimani", address: "Riverside Drive, Kilimani", lat: -1.2716, lng: 36.8012 },
  { id: "v3", name: "Kona Café", neighbourhood: "Madaraka", address: "Ole Sangale Road, Madaraka", lat: -1.3094, lng: 36.8134 },
  { id: "v4", name: "Hub 42", neighbourhood: "Kilimani", address: "Argwings Kodhek Road, Kilimani", lat: -1.2921, lng: 36.7856 },
  { id: "v5", name: "Karura Gate A", neighbourhood: "Gigiri", address: "Limuru Road, Karura Forest", lat: -1.2433, lng: 36.8371 },
  { id: "v6", name: "Garden Court", neighbourhood: "Lavington", address: "James Gichuru Road, Lavington", lat: -1.2784, lng: 36.7691 },
  { id: "v7", name: "Sky Deck", neighbourhood: "Westlands", address: "Waiyaki Way, Westlands", lat: -1.2655, lng: 36.8048 },
  { id: "v8", name: "Madaraka Estate Grounds", neighbourhood: "Madaraka", address: "Madaraka Estate, off Mbagathi Way", lat: -1.3068, lng: 36.8201 },
];

type Seed = Omit<Event, "updatedAt" | "status"> & { status?: Event["status"] };

const SEED: Seed[] = [
  {
    id: "1", title: "Friday Jazz Night", category: "Music", startsAt: at(0, "19:30"), endsAt: at(0, "23:00"), venueId: "v1", priceKes: 1000,
    organiser: "Blue Room Sessions", link: "https://example.com/jazz-night",
    description: "A night of live jazz with the house quartet and guest vocalists. Doors open at 19:00, first set at 19:30. Food and drinks available at the bar.",
  },
  {
    id: "2", title: "Weekend Craft Market", category: "Food & Markets", startsAt: at(1, "10:00"), endsAt: at(1, "17:00"), venueId: "v2", priceKes: null,
    organiser: "Makers of Nairobi", link: "https://example.com/craft-market",
    description: "Over 40 local makers selling ceramics, textiles, prints and leather goods, plus street food and coffee. Bring cash and M-Pesa.",
  },
  {
    id: "3", title: "Open Mic Poetry", category: "Arts", startsAt: at(0, "18:00"), endsAt: at(0, "21:00"), venueId: "v3", priceKes: 300,
    organiser: "Kona Collective", link: "https://example.com/open-mic",
    description: "Spoken word, poetry and short stories in English, Swahili and Sheng. Sign up at the door to perform; slots are five minutes each.",
  },
  {
    id: "4", title: "Startup Founders Talk", category: "Talks", startsAt: at(2, "17:30"), endsAt: at(2, "19:30"), venueId: "v4", priceKes: null,
    organiser: "Hub 42", link: "https://example.com/founders-talk",
    description: "Three Nairobi founders share what went wrong in their first year and what they would do differently. Q&A and networking after.",
  },
  {
    id: "5", title: "Sunday Park Run", category: "Sport", startsAt: at(4, "07:00"), endsAt: at(4, "09:00"), venueId: "v5", priceKes: null,
    organiser: "Karura Runners", link: "https://example.com/park-run",
    description: "A relaxed 5 km loop through Karura Forest. All paces welcome, walkers too. Forest entry fee applies at the gate.",
  },
  {
    id: "6", title: "Family Movie Afternoon", category: "Family", startsAt: at(4, "14:00"), endsAt: at(4, "16:30"), venueId: "v6", priceKes: 500,
    organiser: "Garden Court", link: "https://example.com/movie-afternoon",
    description: "An outdoor screening of an animated favourite on the lawn. Bring a blanket; popcorn and juice for sale. Kids under 3 go free.",
  },
  {
    id: "7", title: "Amapiano Rooftop", category: "Nightlife", startsAt: at(3, "21:00"), endsAt: at(4, "02:00"), venueId: "v7", priceKes: 1500,
    organiser: "Sky Deck", link: "https://example.com/amapiano",
    description: "Resident DJs and a guest from Johannesburg on the rooftop terrace. 18+ with ID.",
  },
  {
    id: "8", title: "Neighbourhood Clean-up", category: "Community", startsAt: at(5, "08:30"), endsAt: at(5, "12:00"), venueId: "v8", priceKes: null,
    organiser: "Madaraka Residents", link: "https://example.com/clean-up",
    description: "Help clear litter from the estate and the stream bank. Gloves, bags and tea provided. Meet at the main gate.",
  },
  {
    id: "9", title: "Afrobeats Dance Class", category: "Music", startsAt: at(2, "18:30"), endsAt: at(2, "20:00"), venueId: "v4", priceKes: 800,
    organiser: "Move Nairobi", link: "https://example.com/dance-class", status: "cancelled",
    description: "A beginner-friendly Afrobeats class. This week's class is cancelled; it returns next week at the same time.",
  },
];

// Ids carry the anchor day so a re-published week arrives as new events rather than edits.
const EVENTS: Event[] = SEED.map((e) => ({ status: "published", ...e, id: `${anchor.day}-${e.id}`, updatedAt: publishedAt }));
const submissions = new Map<string, Submission>();

/** Behaves like a network call: fails when offline, takes a moment otherwise. */
async function roundTrip() {
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false || state.isInternetReachable === false) throw new Error("offline");
  await new Promise((r) => setTimeout(r, 600));
}

export async function fetchChanges(updatedSince: string | null): Promise<Changes> {
  await roundTrip();
  const events = updatedSince ? EVENTS.filter((e) => e.updatedAt > updatedSince) : EVENTS;
  const venueIds = new Set(events.map((e) => e.venueId));
  return { serverTime: new Date().toISOString(), events, venues: VENUES.filter((v) => venueIds.has(v.id)) };
}

export async function submitEvent(submission: Submission) {
  await roundTrip();
  submissions.set(submission.id, submission); // Map keyed by id makes retries idempotent.
}
