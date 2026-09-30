import { fireEvent, render, screen } from "@testing-library/react-native";

import { SavePanel } from "@/components/save-panel";
import { getSaved } from "@/data/saved";
import { listed } from "@/test/fixtures";

jest.mock("@/lib/reminders", () => ({
  remindersSupported: true,
  ensurePermission: jest.fn(async () => true),
  scheduleReminder: jest.fn(async () => "notification-1"),
  cancelReminder: jest.fn(async () => {}),
  notifyEventChanged: jest.fn(async () => {}),
}));

// Wednesday noon; the fixture event is Friday evening, so every reminder option is still ahead.
beforeEach(() => jest.useFakeTimers({ now: Date.parse("2026-09-30T09:00:00Z") }));
afterEach(() => jest.useRealTimers());

describe("SavePanel (F11, F12)", () => {
  it("saves the event with the 2 h reminder picked, then lets you change it", async () => {
    await render(<SavePanel event={listed()} />);

    await fireEvent.press(screen.getByRole("button", { name: "Save this event" }));
    expect(await screen.findByText("Saved")).toBeOnTheScreen();
    expect(screen.getByRole("checkbox", { name: "2 h before" })).toBeChecked();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Morning of" }));
    expect(await screen.findByRole("checkbox", { name: "Morning of", checked: true })).toBeOnTheScreen();
    expect(getSaved().e1.reminder).toBe("morning");
  });

  it("hides reminder choices for a cancelled event", async () => {
    await render(<SavePanel event={listed({ id: "cancelled", status: "cancelled" })} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save this event" }));
    expect(await screen.findByText("Saved")).toBeOnTheScreen();
    expect(screen.queryByText("Remind me")).toBeNull();
  });
});
