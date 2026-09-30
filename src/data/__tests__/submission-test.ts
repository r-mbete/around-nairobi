import { BLANK, type Form, toSubmission, validate } from "@/data/submission";

// Noon on Wed 30 Sep in Nairobi.
const NOW = new Date("2026-09-30T09:00:00Z");

const valid: Form = {
  ...BLANK,
  title: "Open Mic Poetry",
  category: "Arts",
  dayOffset: 2,
  start: "18:00",
  end: "21:00",
  venueName: "Kona Café",
  neighbourhood: "Madaraka",
  address: "Ole Sangale Road",
  description: "Poetry and stories.",
  link: "https://example.com/open-mic",
  contact: "organiser@example.com",
};

describe("validate (F14)", () => {
  it("accepts a complete form", () => {
    expect(validate(valid)).toEqual({});
  });

  it("flags every required field on a blank form", () => {
    expect(Object.keys(validate(BLANK)).sort()).toEqual(
      ["address", "category", "contact", "dayOffset", "description", "link", "neighbourhood", "start", "title", "venueName"].sort(),
    );
  });

  it("allows an empty end time but rejects a malformed one", () => {
    expect(validate({ ...valid, end: "" })).toEqual({});
    expect(validate({ ...valid, end: "9pm" }).end).toBeDefined();
  });

  it("enforces the title and description limits from the data model", () => {
    expect(validate({ ...valid, title: "x".repeat(81) }).title).toMatch(/80/);
    expect(validate({ ...valid, description: "x".repeat(1001) }).description).toMatch(/1,000/);
  });

  it("needs a whole-number price only for paid events", () => {
    expect(validate({ ...valid, free: false, price: "" }).price).toBeDefined();
    expect(validate({ ...valid, free: false, price: "5.50" }).price).toBeDefined();
    expect(validate({ ...valid, free: false, price: "500" })).toEqual({});
  });

  it("needs a web link", () => {
    expect(validate({ ...valid, link: "example.com" }).link).toBeDefined();
    expect(validate({ ...valid, link: "http://example.com" })).toEqual({});
  });
});

describe("toSubmission", () => {
  it("converts the chosen day and times from Nairobi time to UTC", () => {
    const s = toSubmission(valid, NOW);
    expect(s.startsAt).toBe("2026-10-02T15:00:00.000Z");
    expect(s.endsAt).toBe("2026-10-02T18:00:00.000Z");
  });

  it("assumes 2 hours when there is no end time", () => {
    expect(toSubmission({ ...valid, end: "" }, NOW).endsAt).toBe("2026-10-02T17:00:00.000Z");
  });

  it("treats an end before the start as running past midnight", () => {
    const s = toSubmission({ ...valid, start: "22:00", end: "02:00" }, NOW);
    expect(s.startsAt).toBe("2026-10-02T19:00:00.000Z");
    expect(s.endsAt).toBe("2026-10-02T23:00:00.000Z");
  });

  it("stores free as a null price, trims text and gives each submission its own id", () => {
    const s = toSubmission({ ...valid, title: "  Open Mic  ", free: true, price: "999" }, NOW);
    expect(s.title).toBe("Open Mic");
    expect(s.priceKes).toBeNull();
    expect(toSubmission({ ...valid, free: false, price: "500" }, NOW).priceKes).toBe(500);
    expect(toSubmission(valid, NOW).id).not.toBe(toSubmission(valid, NOW).id);
  });
});
