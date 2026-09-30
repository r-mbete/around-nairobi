import type { Event, ListedEvent, Venue } from "@/data/events";

export const venue = (overrides: Partial<Venue> = {}): Venue => ({
  id: "v1",
  name: "The Blue Room",
  neighbourhood: "Westlands",
  address: "Woodvale Grove",
  lat: -1.26,
  lng: 36.8,
  ...overrides,
});

// 2026-10-02 19:30–23:00 in Nairobi (16:30–20:00 UTC).
export const event = (overrides: Partial<Event> = {}): Event => ({
  id: "e1",
  title: "Friday Jazz Night",
  description: "Live jazz.",
  category: "Music",
  startsAt: "2026-10-02T16:30:00.000Z",
  endsAt: "2026-10-02T20:00:00.000Z",
  venueId: "v1",
  priceKes: 1000,
  organiser: "Blue Room Sessions",
  link: "https://example.com/jazz",
  status: "published",
  updatedAt: "2026-09-30T08:00:00.000Z",
  ...overrides,
});

export const listed = (overrides: Partial<Event> = {}, venueOverrides: Partial<Venue> = {}): ListedEvent => {
  const v = venue(venueOverrides);
  return { ...event({ venueId: v.id, ...overrides }), venue: v };
};
