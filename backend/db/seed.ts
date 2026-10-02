import { sql } from "drizzle-orm";

import { eatDayStart } from "../lib/time";

import { createDb, type Db } from "./index";
import { events, submissions, venues } from "./schema";

// npm run db:seed — sample venues, a week of events and two submissions to moderate, dated from today.
// Skips if events already exist; `npm run db:seed -- --reset` wipes everything first.

const at = (day: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(eatDayStart(day).getTime() + (h * 60 + m) * 60_000);
};

const VENUES = [
  { name: "The Blue Room", neighbourhood: "Westlands", address: "Woodvale Grove, Westlands", lat: -1.2641, lng: 36.8029 },
  { name: "Riverside Grounds", neighbourhood: "Kilimani", address: "Riverside Drive, Kilimani", lat: -1.2716, lng: 36.8012 },
  { name: "Kona Café", neighbourhood: "Madaraka", address: "Ole Sangale Road, Madaraka", lat: -1.3094, lng: 36.8134 },
  { name: "Hub 42", neighbourhood: "Kilimani", address: "Argwings Kodhek Road, Kilimani", lat: -1.2921, lng: 36.7856 },
  { name: "Karura Gate A", neighbourhood: "Gigiri", address: "Limuru Road, Karura Forest", lat: -1.2433, lng: 36.8371 },
  { name: "Garden Court", neighbourhood: "Lavington", address: "James Gichuru Road, Lavington", lat: -1.2784, lng: 36.7691 },
  { name: "Sky Deck", neighbourhood: "Westlands", address: "Waiyaki Way, Westlands", lat: -1.2655, lng: 36.8048 },
  { name: "Madaraka Estate Grounds", neighbourhood: "Madaraka", address: "Madaraka Estate, off Mbagathi Way", lat: -1.3068, lng: 36.8201 },
];

type SeedEvent = Omit<typeof events.$inferInsert, "venueId"> & { venue: string };

const EVENTS: SeedEvent[] = [
  { venue: "The Blue Room", title: "Friday Jazz Night", category: "Music", startsAt: at(0, "19:30"), endsAt: at(0, "23:00"), priceKes: 1000, organiser: "Blue Room Sessions", link: "https://example.com/jazz-night", description: "A night of live jazz with the house quartet and guest vocalists. Doors open at 19:00, first set at 19:30." },
  { venue: "Riverside Grounds", title: "Weekend Craft Market", category: "Food & Markets", startsAt: at(1, "10:00"), endsAt: at(1, "17:00"), priceKes: null, organiser: "Makers of Nairobi", link: "https://example.com/craft-market", description: "Over 40 local makers selling ceramics, textiles, prints and leather goods, plus street food and coffee." },
  { venue: "Kona Café", title: "Open Mic Poetry", category: "Arts", startsAt: at(0, "18:00"), endsAt: at(0, "21:00"), priceKes: 300, organiser: "Kona Collective", link: "https://example.com/open-mic", description: "Spoken word, poetry and short stories in English, Swahili and Sheng. Sign up at the door to perform." },
  { venue: "Hub 42", title: "Startup Founders Talk", category: "Talks", startsAt: at(2, "17:30"), endsAt: at(2, "19:30"), priceKes: null, organiser: "Hub 42", link: "https://example.com/founders-talk", description: "Three Nairobi founders share what went wrong in their first year. Q&A and networking after." },
  { venue: "Karura Gate A", title: "Sunday Park Run", category: "Sport", startsAt: at(4, "07:00"), endsAt: at(4, "09:00"), priceKes: null, organiser: "Karura Runners", link: "https://example.com/park-run", description: "A relaxed 5 km loop through Karura Forest. All paces welcome, walkers too." },
  { venue: "Garden Court", title: "Family Movie Afternoon", category: "Family", startsAt: at(4, "14:00"), endsAt: at(4, "16:30"), priceKes: 500, organiser: "Garden Court", link: "https://example.com/movie-afternoon", description: "An outdoor screening on the lawn. Bring a blanket; popcorn and juice for sale." },
  { venue: "Sky Deck", title: "Amapiano Rooftop", category: "Nightlife", startsAt: at(3, "21:00"), endsAt: at(4, "02:00"), priceKes: 1500, organiser: "Sky Deck", link: "https://example.com/amapiano", description: "Resident DJs and a guest from Johannesburg on the rooftop terrace. 18+ with ID." },
  { venue: "Madaraka Estate Grounds", title: "Neighbourhood Clean-up", category: "Community", startsAt: at(5, "08:30"), endsAt: at(5, "12:00"), priceKes: null, organiser: "Madaraka Residents", link: "https://example.com/clean-up", description: "Help clear litter from the estate and the stream bank. Gloves, bags and tea provided." },
  { venue: "Hub 42", title: "Afrobeats Dance Class", category: "Music", startsAt: at(2, "18:30"), endsAt: at(2, "20:00"), priceKes: 800, organiser: "Move Nairobi", link: "https://example.com/dance-class", status: "cancelled", description: "A beginner-friendly Afrobeats class. This week's class is cancelled; it returns next week." },
];

const SUBMISSIONS: (typeof submissions.$inferInsert)[] = [
  { id: "seed-sub-1", title: "Thursday Book Swap", category: "Community", startsAt: at(1, "18:00"), endsAt: at(1, "20:00"), venueName: "Kona Café", neighbourhood: "Madaraka", address: "Ole Sangale Road", priceKes: null, description: "Bring a book, take a book. Tea and mandazi on the house.", link: "https://example.com/book-swap", contact: "books@example.com" },
  { id: "seed-sub-2", title: "Rooftop Salsa Social", category: "Nightlife", startsAt: at(3, "20:00"), endsAt: at(3, "23:30"), venueName: "Alchemist Rooftop", neighbourhood: "Westlands", address: "Parklands Road", priceKes: 700, description: "Beginner lesson at 20:00, open dancing until late.", link: "https://example.com/salsa", contact: "+254 700 000000" },
];

export async function seed(db: Db, { reset = false } = {}) {
  if (reset) await db.execute(sql`TRUNCATE submissions, events, venues CASCADE`);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(events);
  if (count > 0) return false;

  const inserted = await db.insert(venues).values(VENUES).returning();
  const idByName = new Map(inserted.map((v) => [v.name, v.id]));
  await db.insert(events).values(EVENTS.map(({ venue, ...e }) => ({ ...e, venueId: idByName.get(venue)! })));
  await db.insert(submissions).values(SUBMISSIONS).onConflictDoNothing();
  return true;
}

async function main() {
  const { db, migrate, close } = createDb();
  await migrate();
  const seeded = await seed(db, { reset: process.argv.includes("--reset") });
  await close();
  console.log(seeded ? "Seeded sample venues, events and submissions." : "Database already has events; use --reset to start over.");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
