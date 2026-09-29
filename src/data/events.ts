export type Category =
  | "Music"
  | "Arts"
  | "Food & Markets"
  | "Talks"
  | "Sport"
  | "Community"
  | "Nightlife"
  | "Family";

export type Event = {
  id: string;
  title: string;
  startsAt: string; // UTC ISO, shown in EAT
  venue: string;
  neighbourhood: string;
  category: Category;
  priceKes: number | null; // null means free
};

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

export const EVENTS: Event[] = [
  { id: "1", title: "Friday Jazz Night", startsAt: at(0, "19:30"), venue: "The Blue Room", neighbourhood: "Westlands", category: "Music", priceKes: 1000 },
  { id: "2", title: "Weekend Craft Market", startsAt: at(1, "10:00"), venue: "Riverside Grounds", neighbourhood: "Kilimani", category: "Food & Markets", priceKes: null },
  { id: "3", title: "Open Mic Poetry", startsAt: at(0, "18:00"), venue: "Kona Café", neighbourhood: "Madaraka", category: "Arts", priceKes: 300 },
  { id: "4", title: "Startup Founders Talk", startsAt: at(2, "17:30"), venue: "Hub 42", neighbourhood: "Kilimani", category: "Talks", priceKes: null },
  { id: "5", title: "Sunday Park Run", startsAt: at(4, "07:00"), venue: "Karura Gate A", neighbourhood: "Gigiri", category: "Sport", priceKes: null },
  { id: "6", title: "Family Movie Afternoon", startsAt: at(4, "14:00"), venue: "Garden Court", neighbourhood: "Lavington", category: "Family", priceKes: 500 },
  { id: "7", title: "Amapiano Rooftop", startsAt: at(3, "21:00"), venue: "Sky Deck", neighbourhood: "Westlands", category: "Nightlife", priceKes: 1500 },
  { id: "8", title: "Neighbourhood Clean-up", startsAt: at(5, "08:30"), venue: "Madaraka Estate Grounds", neighbourhood: "Madaraka", category: "Community", priceKes: null },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatTime(iso: string) {
  const eat = toEat(new Date(iso));
  return `${String(eat.getUTCHours()).padStart(2, "0")}:${String(eat.getUTCMinutes()).padStart(2, "0")}`;
}

export function priceLabel(priceKes: number | null) {
  return priceKes === null ? "Free" : `KES ${priceKes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export type DaySection = { key: string; title: string; date: string; data: Event[] };

/** Groups events into today plus the next 6 days (F1), sorted by start time, skipping empty days. */
export function groupByDay(events: Event[], now = new Date()): DaySection[] {
  const today = eatMidnightUtcMs(now);
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return Array.from({ length: 7 }, (_, offset) => {
    const start = today + offset * DAY_MS;
    const day = toEat(new Date(start));
    return {
      key: String(offset),
      title: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : WEEKDAYS[day.getUTCDay()],
      date: `${WEEKDAYS[day.getUTCDay()]} ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`,
      data: sorted.filter((e) => {
        const t = Date.parse(e.startsAt);
        return t >= start && t < start + DAY_MS;
      }),
    };
  }).filter((s) => s.data.length > 0);
}
