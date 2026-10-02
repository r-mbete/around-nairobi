import { describe, expect, it } from "vitest";

import { submissionSchema } from "@/lib/contract";
import { parseReview, type ReviewValues } from "@/lib/review-form";
import { adminConfig, createSessionToken, isValidSessionToken, passwordMatches, SESSION_TTL_MS } from "@/lib/session";
import { fromEatInput, toEatInput } from "@/lib/time";

import { submissionInput } from "./helpers";

describe("Nairobi time inputs", () => {
  it("reads datetime-local values as Nairobi time and writes them back", () => {
    const d = fromEatInput("2026-10-02T19:30");
    expect(d?.toISOString()).toBe("2026-10-02T16:30:00.000Z");
    expect(toEatInput(d!)).toBe("2026-10-02T19:30");
  });

  it("rejects malformed values", () => {
    for (const bad of ["", "2026-10-02", "2026-10-02 19:30", "2026-13-40T99:99"]) expect(fromEatInput(bad)).toBeNull();
  });
});

describe("submission contract", () => {
  it("accepts what the app sends", () => {
    expect(submissionSchema.safeParse(submissionInput()).success).toBe(true);
  });

  it.each([
    ["an end before the start", { endsAt: "2026-10-02T14:00:00.000Z" }],
    ["a non-web link", { link: "javascript:alert(1)" }],
    ["an unknown category", { category: "Crypto" }],
    ["a fractional price", { priceKes: 99.5 }],
    ["a blank title", { title: "   " }],
    ["a too-long description", { description: "x".repeat(1001) }],
    ["an odd id", { id: "../etc" }],
  ])("rejects %s", (_label, overrides) => {
    expect(submissionSchema.safeParse({ ...submissionInput(), ...overrides }).success).toBe(false);
  });
});

describe("admin review form", () => {
  const values: ReviewValues = {
    title: "Open Mic",
    category: "Arts",
    startsAt: "2026-10-02T18:00",
    endsAt: "2026-10-02T21:00",
    venueName: "Kona Café",
    neighbourhood: "Madaraka",
    address: "Ole Sangale Road",
    lat: "-1.3094",
    lng: "36.8134",
    organiser: "Kona Collective",
    price: "",
    description: "Poetry.",
    link: "https://example.com",
  };

  it("parses Nairobi times, coordinates and a blank price as free", () => {
    const result = parseReview(values);
    expect(result.ok && result.data).toMatchObject({ startsAt: new Date("2026-10-02T15:00:00.000Z"), lat: -1.3094, priceKes: null });
  });

  it("explains bad coordinates, prices and times per field", () => {
    const result = parseReview({ ...values, lat: "36.8", price: "five hundred", endsAt: "2026-10-02T17:00" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.fields?.lat).toMatch(/Nairobi/);
      expect(result.state.fields?.price).toMatch(/shillings/);
      expect(result.state.fields?.endsAt).toMatch(/after/);
      expect(result.state.values).toEqual({ ...values, lat: "36.8", price: "five hundred", endsAt: "2026-10-02T17:00" });
    }
  });
});

describe("admin session", () => {
  const secret = "s".repeat(32);

  it("accepts its own token until it expires", () => {
    const token = createSessionToken(secret, 1_000);
    expect(isValidSessionToken(token, secret, 1_001)).toBe(true);
    expect(isValidSessionToken(token, secret, 1_000 + SESSION_TTL_MS + 1)).toBe(false);
  });

  it("rejects tampered, foreign or missing tokens", () => {
    const [expires, sig] = createSessionToken(secret, 1_000).split(".");
    expect(isValidSessionToken(`${Number(expires) + 9_999_999}.${sig}`, secret, 1_001)).toBe(false);
    expect(isValidSessionToken(createSessionToken("o".repeat(32), 1_000), secret, 1_001)).toBe(false);
    expect(isValidSessionToken(undefined, secret)).toBe(false);
    expect(isValidSessionToken("garbage", secret)).toBe(false);
  });

  it("checks the password and refuses weak setup", () => {
    expect(passwordMatches("correct horse", "correct horse")).toBe(true);
    expect(passwordMatches("wrong", "correct horse")).toBe(false);
    expect(passwordMatches("", "")).toBe(false);
    expect(adminConfig({ ADMIN_PASSWORD: "short", SESSION_SECRET: secret })).toBeNull();
    expect(adminConfig({ ADMIN_PASSWORD: "long enough pw", SESSION_SECRET: "short" })).toBeNull();
    expect(adminConfig({ ADMIN_PASSWORD: "long enough pw", SESSION_SECRET: secret })).not.toBeNull();
  });
});
