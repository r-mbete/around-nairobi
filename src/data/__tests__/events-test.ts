import { eatDateTime, eatDayStart, formatDay, formatTime, groupByDay, parseHhmm, priceLabel, timeAgo } from "@/data/events";
import { listed } from "@/test/fixtures";

// 01:00 on Wed 30 Sep in Nairobi, which is still 29 Sep in UTC.
const JUST_AFTER_MIDNIGHT = new Date("2026-09-29T22:00:00Z");

describe("Nairobi time helpers", () => {
  it("finds Nairobi midnight even when the UTC date is a day behind", () => {
    expect(new Date(eatDayStart(0, JUST_AFTER_MIDNIGHT)).toISOString()).toBe("2026-09-29T21:00:00.000Z");
    expect(new Date(eatDayStart(1, JUST_AFTER_MIDNIGHT)).toISOString()).toBe("2026-09-30T21:00:00.000Z");
  });

  it("converts a Nairobi wall-clock time to UTC and back", () => {
    const iso = eatDateTime(eatDayStart(0, JUST_AFTER_MIDNIGHT), "19:30");
    expect(iso).toBe("2026-09-30T16:30:00.000Z");
    expect(formatTime(iso)).toBe("19:30");
    expect(formatDay(iso)).toBe("Wed 30 Sep");
  });

  it("parses only valid 24-hour times", () => {
    expect(parseHhmm("19:30")).toBe(19 * 60 + 30);
    expect(parseHhmm("7:05")).toBe(7 * 60 + 5);
    expect(parseHhmm(" 00:00 ")).toBe(0);
    for (const bad of ["24:00", "19:3", "7pm", "19.30", ""]) expect(parseHhmm(bad)).toBeNull();
  });
});

describe("priceLabel", () => {
  it("labels free events and formats KES with thousands separators", () => {
    expect(priceLabel(null)).toBe("Free");
    expect(priceLabel(300)).toBe("KES 300");
    expect(priceLabel(12500)).toBe("KES 12,500");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-09-30T12:00:00Z");
  it.each([
    [20_000, "just now"],
    [5 * 60_000, "5 min ago"],
    [3 * 3_600_000, "3 h ago"],
    [26 * 3_600_000, "1 day ago"],
    [50 * 3_600_000, "2 days ago"],
  ])("%d ms ago reads %s", (ago, label) => {
    expect(timeAgo(now - ago, now)).toBe(label);
  });
});

describe("groupByDay (F1)", () => {
  const at = (day: number, hhmm: string) => eatDateTime(eatDayStart(day, JUST_AFTER_MIDNIGHT), hhmm);

  it("groups by Nairobi day, sorts by start time and names today and tomorrow", () => {
    const sections = groupByDay(
      [
        listed({ id: "late", startsAt: at(0, "21:00") }),
        listed({ id: "early", startsAt: at(0, "08:00") }),
        listed({ id: "tomorrow", startsAt: at(1, "10:00") }),
        listed({ id: "friday", startsAt: at(2, "10:00") }),
      ],
      JUST_AFTER_MIDNIGHT,
    );
    expect(sections.map((s) => s.title)).toEqual(["Today", "Tomorrow", "Fri"]);
    expect(sections[0].data.map((e) => e.id)).toEqual(["early", "late"]);
    expect(sections[2].date).toBe("Fri 2 Oct");
  });

  it("skips empty days and ignores events beyond the next 7 days", () => {
    const sections = groupByDay([listed({ id: "d3", startsAt: at(3, "10:00") }), listed({ id: "d7", startsAt: at(7, "10:00") })], JUST_AFTER_MIDNIGHT);
    expect(sections).toHaveLength(1);
    expect(sections[0].data.map((e) => e.id)).toEqual(["d3"]);
  });
});
