import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { EventCard } from "@/components/event-card";
import { listed } from "@/test/fixtures";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/lib/reminders", () => ({ remindersSupported: false }));

describe("EventCard (F2)", () => {
  it("shows time, title, venue, neighbourhood, category and price", async () => {
    await render(<EventCard event={listed()} />);
    for (const text of ["19:30", "Friday Jazz Night", "The Blue Room · Westlands", "Music", "KES 1,000"]) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
  });

  it("reads as a single button with the whole event for screen readers", async () => {
    await render(<EventCard event={listed({ priceKes: null })} />);
    expect(
      screen.getByRole("button", { name: "Friday Jazz Night. Music. 19:30 at The Blue Room, Westlands. Free." }),
    ).toBeOnTheScreen();
  });

  it("marks cancelled events instead of showing a price (O9)", async () => {
    await render(<EventCard event={listed({ status: "cancelled" })} />);
    expect(screen.getByText("Cancelled")).toBeOnTheScreen();
    expect(screen.queryByText("KES 1,000")).toBeNull();
    expect(screen.getByRole("button", { name: /^Cancelled\. Friday Jazz Night/ })).toBeOnTheScreen();
  });

  it("opens the event detail when tapped", async () => {
    await render(<EventCard event={listed()} />);
    await fireEvent.press(screen.getByRole("button"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/event/[id]", params: { id: "e1" } });
  });
});
