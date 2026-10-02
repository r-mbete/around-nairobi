import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDb } from "@/db";

import { submissionInput, wipe } from "./helpers";

// Point the routes' shared connection at an in-memory database before importing them.
const handle = createDb({ memory: true });
await handle.migrate();
(globalThis as { __db?: typeof handle }).__db = handle;

const events = await import("@/app/api/events/route");
const submissions = await import("@/app/api/submissions/route");

const post = (body: unknown, headers: Record<string, string> = {}) =>
  submissions.POST(
    new Request("http://test/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => wipe(handle.db));
afterAll(() => handle.close());

describe("POST /api/submissions", () => {
  it("201 on first receipt, 200 on a retry, with CORS for the web preview", async () => {
    const first = await post(submissionInput(), { "Idempotency-Key": "sub-123456" });
    expect(first.status).toBe(201);
    expect(first.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await first.json()).toEqual({ id: "sub-123456", status: "pending" });

    expect((await post(submissionInput(), { "Idempotency-Key": "sub-123456" })).status).toBe(200);
  });

  it("422 with field errors for an invalid submission", async () => {
    const res = await post(submissionInput({ link: "not a link", title: "" }));
    expect(res.status).toBe(422);
    expect(Object.keys((await res.json()).fields).sort()).toEqual(["link", "title"]);
  });

  it("400 for non-JSON or a mismatched Idempotency-Key, 413 for an oversized body", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post(submissionInput(), { "Idempotency-Key": "other-key" })).status).toBe(400);
    expect((await post("x".repeat(20_000))).status).toBe(413);
  });
});

describe("GET /api/events", () => {
  it("returns the contract shape and isn't cached", async () => {
    const res = await events.GET(new NextRequest("http://test/api/events"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toMatchObject({ serverTime: expect.any(String), events: [], venues: [] });
  });

  it("400 for a bad updatedSince", async () => {
    expect((await events.GET(new NextRequest("http://test/api/events?updatedSince=yesterday"))).status).toBe(400);
  });

  it("answers CORS preflight", async () => {
    const res = events.OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Idempotency-Key");
  });
});
