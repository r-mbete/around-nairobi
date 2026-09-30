import type { ListedEvent } from "@/data/events";

// expo-notifications has no web support; the web preview saves events without reminders.

export const remindersSupported = false;

export function configureNotifications() {}

export async function ensurePermission() {
  return false;
}

export async function scheduleReminder(_event: ListedEvent, _at: number): Promise<string | null> {
  return null;
}

export async function cancelReminder(_id: string) {}

export async function notifyEventChanged(_event: ListedEvent, _kind: "cancelled" | "updated") {}

export function useNotificationTaps() {}
