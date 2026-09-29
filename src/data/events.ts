export const CATEGORIES = [
  "Music",
  "Arts",
  "Food & Markets",
  "Talks",
  "Sport",
  "Community",
  "Nightlife",
  "Family",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Venue = {
  id: string;
  name: string;
  neighbourhood: string;
  address: string;
  lat: number;
  lng: number;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: Category;
  startsAt: string; // UTC ISO, shown in EAT
  endsAt: string;
  venueId: string;
  priceKes: number | null; // null means free
  organiser: string;
  link: string;
  status: "pending" | "published" | "cancelled";
};

/** An event joined with its venue, which is what screens render. */
export type ListedEvent = Event & { venue: Venue };

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // Africa/Nairobi is UTC+3 with no DST
const DAY_MS = 24 * 60 * 60 * 1000;

/** Shifts a date so its UTC getters read Nairobi wall-clock time. */
function toEat(date: Date) {
  return new Date(date.getTime() + EAT_OFFSET_MS);
}

function eatMidnightUtcMs(date: Date) {
  const eat = toEat(date);
  return Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate()) - EAT_OFFSET_MS;
}

/** Seed helper: an EAT time `dayOffset` days from today, as a UTC ISO string. */
function at(dayOffset: number, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(eatMidnightUtcMs(new Date()) + dayOffset * DAY_MS + (h * 60 + m) * 60 * 1000).toISOString();
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

const EVENTS: Event[] = [
  {
    id: "1", title: "Friday Jazz Night", category: "Music", startsAt: at(0, "19:30"), endsAt: at(0, "23:00"), venueId: "v1", priceKes: 1000,
    organiser: "Blue Room Sessions", link: "https://example.com/jazz-night", status: "published",
    description: "A night of live jazz with the house quartet and guest vocalists. Doors open at 19:00, first set at 19:30. Food and drinks available at the bar.",
  },
  {
    id: "2", title: "Weekend Craft Market", category: "Food & Markets", startsAt: at(1, "10:00"), endsAt: at(1, "17:00"), venueId: "v2", priceKes: null,
    organiser: "Makers of Nairobi", link: "https://example.com/craft-market", status: "published",
    description: "Over 40 local makers selling ceramics, textiles, prints and leather goods, plus street food and coffee. Bring cash and M-Pesa.",
  },
  {
    id: "3", title: "Open Mic Poetry", category: "Arts", startsAt: at(0, "18:00"), endsAt: at(0, "21:00"), venueId: "v3", priceKes: 300,
    organiser: "Kona Collective", link: "https://example.com/open-mic", status: "published",
    description: "Spoken word, poetry and short stories in English, Swahili and Sheng. Sign up at the door to perform; slots are five minutes each.",
  },
  {
    id: "4", title: "Startup Founders Talk", category: "Talks", startsAt: at(2, "17:30"), endsAt: at(2, "19:30"), venueId: "v4", priceKes: null,
    organiser: "Hub 42", link: "https://example.com/founders-talk", status: "published",
    description: "Three Nairobi founders share what went wrong in their first year and what they would do differently. Q&A and networking after.",
  },
  {
    id: "5", title: "Sunday Park Run", category: "Sport", startsAt: at(4, "07:00"), endsAt: at(4, "09:00"), venueId: "v5", priceKes: null,
    organiser: "Karura Runners", link: "https://example.com/park-run", status: "published",
    description: "A relaxed 5 km loop through Karura Forest. All paces welcome, walkers too. Forest entry fee applies at the gate.",
  },
  {
    id: "6", title: "Family Movie Afternoon", category: "Family", startsAt: at(4, "14:00"), endsAt: at(4, "16:30"), venueId: "v6", priceKes: 500,
    organiser: "Garden Court", link: "https://example.com/movie-afternoon", status: "published",
    description: "An outdoor screening of an animated favourite on the lawn. Bring a blanket; popcorn and juice for sale. Kids under 3 go free.",
  },
  {
    id: "7", title: "Amapiano Rooftop", category: "Nightlife", startsAt: at(3, "21:00"), endsAt: at(4, "02:00"), venueId: "v7", priceKes: 1500,
    organiser: "Sky Deck", link: "https://example.com/amapiano", status: "published",
    description: "Resident DJs and a guest from Johannesburg on the rooftop terrace. 18+ with ID.",
  },
  {
    id: "8", title: "Neighbourhood Clean-up", category: "Community", startsAt: at(5, "08:30"), endsAt: at(5, "12:00"), venueId: "v8", priceKes: null,
    organiser: "Madaraka Residents", link: "https://example.com/clean-up", status: "published",
    description: "Help clear litter from the estate and the stream bank. Gloves, bags and tea provided. Meet at the main gate.",
  },
  {
    id: "9", title: "Afrobeats Dance Class", category: "Music", startsAt: at(2, "18:30"), endsAt: at(2, "20:00"), venueId: "v4", priceKes: 800,
    organiser: "Move Nairobi", link: "https://example.com/dance-class", status: "cancelled",
    description: "A beginner-friendly Afrobeats class. This week's class is cancelled; it returns next week at the same time.",
  },
];

const venuesById = new Map(VENUES.map((v) => [v.id, v]));

function withVenue(event: Event): ListedEvent | null {
  const venue = venuesById.get(event.venueId);
  return venue ? { ...event, venue } : null;
}

/** Published and cancelled events that haven't ended yet (O9, F17). Pending ones stay hidden (F16). */
export function listEvents(now = new Date()): ListedEvent[] {
  return EVENTS.filter((e) => e.status !== "pending" && Date.parse(e.endsAt) > now.getTime())
    .map(withVenue)
    .filter((e): e is ListedEvent => e !== null);
}

export function getEvent(id: string): ListedEvent | null {
  const event = EVENTS.find((e) => e.id === id && e.status !== "pending");
  return event ? withVenue(event) : null;
}

export const NEIGHBOURHOODS = [...new Set(VENUES.map((v) => v.neighbourhood))].sort();

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatTime(iso: string) {
  const eat = toEat(new Date(iso));
  return `${String(eat.getUTCHours()).padStart(2, "0")}:${String(eat.getUTCMinutes()).padStart(2, "0")}`;
}

/** e.g. "Tue 29 Sep" in EAT. */
export function formatDay(iso: string) {
  const eat = toEat(new Date(iso));
  return `${WEEKDAYS[eat.getUTCDay()]} ${eat.getUTCDate()} ${MONTHS[eat.getUTCMonth()]}`;
}

export function priceLabel(priceKes: number | null) {
  return priceKes === null ? "Free" : `KES ${priceKes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export type DaySection = { key: string; title: string; date: string; data: ListedEvent[] };

/** Groups events into today plus the next 6 days (F1), sorted by start time, skipping empty days. */
export function groupByDay(events: ListedEvent[], now = new Date()): DaySection[] {
  const today = eatMidnightUtcMs(now);
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return Array.from({ length: 7 }, (_, offset) => {
    const start = today + offset * DAY_MS;
    const date = formatDay(new Date(start).toISOString());
    return {
      key: String(offset),
      title: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.slice(0, 3),
      date,
      data: sorted.filter((e) => {
        const t = Date.parse(e.startsAt);
        return t >= start && t < start + DAY_MS;
      }),
    };
  }).filter((s) => s.data.length > 0);
}
