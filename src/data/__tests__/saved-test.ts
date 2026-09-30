import {
  availableReminders,
  getSaved,
  onSavedEventChanged,
  reminderTime,
  saveEvent,
  setReminder,
  unsaveEvent,
} from "@/data/saved";
import * as reminders from "@/lib/reminders";
import { listed } from "@/test/fixtures";

jest.mock("@/lib/reminders", () => ({
  remindersSupported: true,
  ensurePermission: jest.fn(async () => true),
  scheduleReminder: jest.fn(async () => "notification-1"),
  cancelReminder: jest.fn(async () => {}),
  notifyEventChanged: jest.fn(async () => {}),
}));

const mocked = jest.mocked(reminders);

// Fixture event: Fri 2 Oct, 19:30–23:00 in Nairobi.
const jazz = listed();
const STARTS = Date.parse(jazz.startsAt);
const HOUR = 3_600_000;
const WED_NOON = Date.parse("2026-09-30T09:00:00Z");

beforeEach(() => {
  jest.useFakeTimers({ now: WED_NOON });
});

afterEach(async () => {
  for (const id of Object.keys(getSaved())) await unsaveEvent(id);
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("reminder times (F12)", () => {
  it("puts 1 h and 2 h before the start, and the morning one at 08:00 Nairobi time", () => {
    expect(reminderTime(jazz, "1h")).toBe(STARTS - HOUR);
    expect(reminderTime(jazz, "2h")).toBe(STARTS - 2 * HOUR);
    expect(new Date(reminderTime(jazz, "morning")).toISOString()).toBe("2026-10-02T05:00:00.000Z");
  });

  it("only offers reminders that are still ahead and before the start", () => {
    expect(availableReminders(jazz, WED_NOON)).toEqual(["1h", "2h", "morning"]);
    expect(availableReminders(jazz, STARTS - 90 * 60_000)).toEqual(["1h"]);
    expect(availableReminders(jazz, STARTS - 10 * 60_000)).toEqual([]);

    const earlyRun = listed({ startsAt: "2026-10-04T04:00:00.000Z" }); // 07:00 Nairobi
    expect(availableReminders(earlyRun, WED_NOON)).toEqual(["1h", "2h"]);
  });
});

describe("saving (F11, F12)", () => {
  it("saves with a 2 h reminder by default", async () => {
    await expect(saveEvent(jazz)).resolves.toBe("scheduled");
    expect(mocked.scheduleReminder).toHaveBeenCalledWith(jazz, STARTS - 2 * HOUR);
    expect(getSaved()[jazz.id]).toMatchObject({ reminder: "2h", notificationId: "notification-1", change: null });
  });

  it("falls back to 1 h when 2 h before has already passed", async () => {
    jest.setSystemTime(STARTS - 90 * 60_000);
    await saveEvent(jazz);
    expect(getSaved()[jazz.id].reminder).toBe("1h");
  });

  it("still saves, without a reminder, when notifications are refused", async () => {
    mocked.ensurePermission.mockResolvedValueOnce(false);
    await expect(saveEvent(jazz)).resolves.toBe("denied");
    expect(getSaved()[jazz.id]).toMatchObject({ reminder: null, notificationId: null });
  });

  it("doesn't set a reminder for a cancelled event", async () => {
    await saveEvent(listed({ status: "cancelled" }));
    expect(mocked.scheduleReminder).not.toHaveBeenCalled();
  });

  it("replaces the old notification when the reminder changes", async () => {
    await saveEvent(jazz);
    mocked.scheduleReminder.mockResolvedValueOnce("notification-2");
    await setReminder(jazz, "morning");
    expect(mocked.cancelReminder).toHaveBeenCalledWith("notification-1");
    expect(getSaved()[jazz.id]).toMatchObject({ reminder: "morning", notificationId: "notification-2" });
  });

  it("cancels the notification when unsaved", async () => {
    await saveEvent(jazz);
    await unsaveEvent(jazz.id);
    expect(mocked.cancelReminder).toHaveBeenCalledWith("notification-1");
    expect(getSaved()[jazz.id]).toBeUndefined();
  });
});

describe("changes to saved events (F13)", () => {
  it("marks a cancellation, drops the reminder and tells the user", async () => {
    await saveEvent(jazz);
    const cancelled = { ...jazz, status: "cancelled" as const };
    await onSavedEventChanged(jazz, cancelled);

    expect(mocked.cancelReminder).toHaveBeenCalledWith("notification-1");
    expect(mocked.notifyEventChanged).toHaveBeenCalledWith(cancelled, "cancelled");
    expect(getSaved()[jazz.id]).toMatchObject({ change: "cancelled", notificationId: null });
  });

  it("marks a new time and moves the reminder with it", async () => {
    await saveEvent(jazz);
    const later = { ...jazz, startsAt: "2026-10-02T17:30:00.000Z" };
    await onSavedEventChanged(jazz, later);

    expect(getSaved()[jazz.id].change).toBe("updated");
    expect(mocked.scheduleReminder).toHaveBeenLastCalledWith(later, Date.parse(later.startsAt) - 2 * HOUR);
    expect(mocked.notifyEventChanged).toHaveBeenCalledWith(later, "updated");
  });

  it("ignores edits that don't affect when or where", async () => {
    await saveEvent(jazz);
    await onSavedEventChanged(jazz, { ...jazz, description: "Now with a guest singer." });
    expect(getSaved()[jazz.id].change).toBeNull();
    expect(mocked.notifyEventChanged).not.toHaveBeenCalled();
  });
});
