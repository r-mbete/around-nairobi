import { cancelReminder, ensurePermission, notifyEventChanged, remindersSupported, scheduleReminder } from "@/lib/reminders";
import { createStore } from "@/lib/store";

import { eatDayStart, HOUR_MS, type ListedEvent } from "./events";

export type ReminderOption = "1h" | "2h" | "morning";

export const REMINDER_LABELS: Record<ReminderOption, string> = {
  "1h": "1 h before",
  "2h": "2 h before",
  morning: "Morning of",
};

export type SavedEntry = {
  savedAt: number;
  reminder: ReminderOption | null;
  notificationId: string | null;
  /** Set when a sync changes or cancels the event; cleared once the user has seen it (F13). */
  change: "cancelled" | "updated" | null;
};

/** Saved events live only on this phone (F11). */
const saved = createStore<Record<string, SavedEntry>>({}, { key: "saved.v1" });

export const useSaved = saved.use;
export const getSaved = saved.get;

/** When a reminder would fire; "morning" is 08:00 in Nairobi on the day it starts. */
export function reminderTime(event: ListedEvent, option: ReminderOption) {
  const start = Date.parse(event.startsAt);
  if (option === "1h") return start - HOUR_MS;
  if (option === "2h") return start - 2 * HOUR_MS;
  return eatDayStart(0, new Date(start)) + 8 * HOUR_MS;
}

/** Options that would still fire before the event starts. */
export function availableReminders(event: ListedEvent, now = Date.now()): ReminderOption[] {
  const start = Date.parse(event.startsAt);
  return (Object.keys(REMINDER_LABELS) as ReminderOption[]).filter((o) => {
    const t = reminderTime(event, o);
    return t > now && t < start;
  });
}

function patch(id: string, changes: Partial<SavedEntry>) {
  saved.set((all) => (all[id] ? { ...all, [id]: { ...all[id], ...changes } } : all));
}

export type ReminderResult = "scheduled" | "none" | "denied" | "unsupported";

/** Sets (or clears, with null) the reminder for a saved event. */
export async function setReminder(event: ListedEvent, option: ReminderOption | null): Promise<ReminderResult> {
  const entry = saved.get()[event.id];
  if (!entry) return "none";
  if (entry.notificationId) await cancelReminder(entry.notificationId);
  patch(event.id, { reminder: option, notificationId: null });
  if (!option) return "none";
  if (!remindersSupported) return "unsupported";

  if (!(await ensurePermission())) {
    patch(event.id, { reminder: null });
    return "denied";
  }
  const id = await scheduleReminder(event, reminderTime(event, option));
  patch(event.id, { notificationId: id, reminder: id ? option : null });
  return id ? "scheduled" : "none";
}

/** Saves an event and offers the default 2 h reminder, or the nearest option that's still ahead (F12). */
export async function saveEvent(event: ListedEvent): Promise<ReminderResult> {
  saved.set((all) => ({ ...all, [event.id]: { savedAt: Date.now(), reminder: null, notificationId: null, change: null } }));
  if (event.status === "cancelled") return "none";
  const options = availableReminders(event);
  const option = options.includes("2h") ? "2h" : (options[options.length - 1] ?? null);
  return setReminder(event, option);
}

export async function unsaveEvent(id: string) {
  const entry = saved.get()[id];
  if (entry?.notificationId) await cancelReminder(entry.notificationId);
  saved.set(({ [id]: _removed, ...rest }) => rest);
}

export function acknowledgeChange(id: string) {
  if (saved.get()[id]?.change) patch(id, { change: null });
}

/** Called by the sync engine when a saved event arrives with new details. */
export async function onSavedEventChanged(prev: ListedEvent, next: ListedEvent) {
  const entry = saved.get()[next.id];
  if (!entry) return;

  if (next.status === "cancelled" && prev.status !== "cancelled") {
    if (entry.notificationId) await cancelReminder(entry.notificationId);
    patch(next.id, { change: "cancelled", notificationId: null });
    await notifyEventChanged(next, "cancelled");
    return;
  }

  const moved = prev.startsAt !== next.startsAt || prev.venueId !== next.venueId;
  if (moved && next.status !== "cancelled") {
    patch(next.id, { change: "updated" });
    // Re-time the existing reminder to the new start.
    if (entry.reminder) await setReminder(next, entry.reminder);
    await notifyEventChanged(next, "updated");
  }
}
