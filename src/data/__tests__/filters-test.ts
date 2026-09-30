import { activeFilterCount, applyFilters, type Filters, toggle } from "@/data/filters";
import { listed } from "@/test/fixtures";

const NONE: Filters = { categories: [], neighbourhoods: [], freeOnly: false };

const jazz = listed({ id: "jazz", title: "Friday Jazz Night", category: "Music", priceKes: 1000, organiser: "Blue Room Sessions" });
const market = listed(
  { id: "market", title: "Craft Market", category: "Food & Markets", priceKes: null, organiser: "Makers of Nairobi", venueId: "v2" },
  { id: "v2", name: "Riverside Grounds", neighbourhood: "Kilimani" },
);
const talk = listed(
  { id: "talk", title: "Founders Talk", category: "Talks", priceKes: null, organiser: "Hub 42", venueId: "v3" },
  { id: "v3", name: "Hub 42", neighbourhood: "Kilimani" },
);
const all = [jazz, market, talk];
const ids = (events: typeof all) => events.map((e) => e.id);

describe("applyFilters (F4, F5)", () => {
  it("returns everything with no filters or search", () => {
    expect(ids(applyFilters(all, NONE))).toEqual(["jazz", "market", "talk"]);
  });

  it("ORs values within a group", () => {
    expect(ids(applyFilters(all, { ...NONE, categories: ["Music", "Talks"] }))).toEqual(["jazz", "talk"]);
  });

  it("ANDs across groups", () => {
    const f: Filters = { categories: ["Food & Markets", "Music"], neighbourhoods: ["Kilimani"], freeOnly: true };
    expect(ids(applyFilters(all, f))).toEqual(["market"]);
  });

  it("free only keeps events with no price", () => {
    expect(ids(applyFilters(all, { ...NONE, freeOnly: true }))).toEqual(["market", "talk"]);
  });

  it("searches title, venue and organiser, ignoring case and spaces", () => {
    expect(ids(applyFilters(all, NONE, "  JAZZ "))).toEqual(["jazz"]);
    expect(ids(applyFilters(all, NONE, "riverside"))).toEqual(["market"]);
    expect(ids(applyFilters(all, NONE, "makers"))).toEqual(["market"]);
    expect(ids(applyFilters(all, NONE, "no such thing"))).toEqual([]);
  });

  it("does not search the description", () => {
    expect(applyFilters([listed({ description: "secret word" })], NONE, "secret")).toEqual([]);
  });
});

describe("filter helpers", () => {
  it("toggle adds a missing value and removes a present one", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });

  it("counts each active filter", () => {
    expect(activeFilterCount(NONE)).toBe(0);
    expect(activeFilterCount({ categories: ["Music", "Arts"], neighbourhoods: ["Westlands"], freeOnly: true })).toBe(4);
  });
});
