// Nairobi is UTC+3 all year (no daylight saving), so conversion is a fixed offset.
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** A Date as a `<input type="datetime-local">` value in Nairobi time, e.g. "2026-10-02T19:30". */
export function toEatInput(date: Date) {
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 16);
}

/** Parses a datetime-local value typed in Nairobi time; null if malformed. */
export function fromEatInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const utc = Date.parse(`${value}:00.000Z`);
  return Number.isNaN(utc) ? null : new Date(utc - EAT_OFFSET_MS);
}

/** Midnight in Nairobi `dayOffset` days from `now`, as a Date. */
export function eatDayStart(dayOffset = 0, now = new Date()) {
  const eat = new Date(now.getTime() + EAT_OFFSET_MS);
  return new Date(Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate() + dayOffset) - EAT_OFFSET_MS);
}

/** Human-readable Nairobi time for admin screens, e.g. "Fri 2 Oct, 19:30". */
export function formatEat(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
