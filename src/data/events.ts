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
  updatedAt: string; // drives the delta sync (O2)
};

/** An event joined with its venue, which is what screens render. */
export type ListedEvent = Event & { venue: Venue };

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // Africa/Nairobi is UTC+3 with no DST
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** Shifts a date so its UTC getters read Nairobi wall-clock time. */
function toEat(date: Date) {
  return new Date(date.getTime() + EAT_OFFSET_MS);
}

/** UTC ms of midnight in Nairobi, `dayOffset` days from `now`. */
export function eatDayStart(dayOffset = 0, now = new Date()) {
  const eat = toEat(now);
  return Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate()) - EAT_OFFSET_MS + dayOffset * DAY_MS;
}

/** Parses "HH:MM" (24 h) to minutes past midnight, or null if invalid. */
export function parseHhmm(hhmm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** A Nairobi wall-clock time on the day starting at `dayStartMs`, as a UTC ISO string. */
export function eatDateTime(dayStartMs: number, hhmm: string) {
  const minutes = parseHhmm(hhmm) ?? 0;
  return new Date(dayStartMs + minutes * 60 * 1000).toISOString();
}

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

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function timeAgo(ms: number, now = Date.now()) {
  const mins = Math.floor((now - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export type DaySection = { key: string; title: string; date: string; data: ListedEvent[] };

/** Groups events into today plus the next 6 days (F1), sorted by start time, skipping empty days. */
export function groupByDay(events: ListedEvent[], now = new Date()): DaySection[] {
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return Array.from({ length: 7 }, (_, offset) => {
    const start = eatDayStart(offset, now);
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
