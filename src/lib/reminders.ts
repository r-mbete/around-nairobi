import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { formatTime, type ListedEvent } from "@/data/events";

export const remindersSupported = true;

const CHANNEL = "reminders";

/** Call once at startup: show reminders while the app is open and create the Android channel. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Event reminders",
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

/** Asks for permission only when needed; returns whether we may notify. */
export async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Schedules a local reminder (F12); returns its id, or null if not allowed. */
export async function scheduleReminder(event: ListedEvent, at: number): Promise<string | null> {
  if (at <= Date.now() || !(await ensurePermission())) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: `Starts at ${formatTime(event.startsAt)} · ${event.venue.name}, ${event.venue.neighbourhood}`,
      data: { eventId: event.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: CHANNEL },
  });
}

export async function cancelReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** Immediate alert when a saved event changes or is cancelled on sync (F13). */
export async function notifyEventChanged(event: ListedEvent, kind: "cancelled" | "updated") {
  const granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: kind === "cancelled" ? `Cancelled: ${event.title}` : `Updated: ${event.title}`,
      body: kind === "cancelled" ? "This saved event has been cancelled." : "The time or venue has changed. Tap to see the details.",
      data: { eventId: event.id },
    },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL } : null,
  });
}

/** Opens the event when someone taps one of our notifications. */
export function useNotificationTaps() {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.content.data?.eventId;
      if (typeof id === "string") router.push({ pathname: "/event/[id]", params: { id } });
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
