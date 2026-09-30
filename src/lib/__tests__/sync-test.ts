/* eslint-disable @typescript-eslint/no-require-imports -- each test loads fresh modules so sync state doesn't leak */
import type { Cache } from "@/data/cache";
import { applyChanges } from "@/lib/sync";
import { event, venue } from "@/test/fixtures";

jest.mock("@/lib/api", () => ({ fetchChanges: jest.fn(), submitEvent: jest.fn(async () => {}) }));
jest.mock("@/lib/reminders", () => ({
  remindersSupported: true,
  ensurePermission: jest.fn(async () => true),
  scheduleReminder: jest.fn(async () => "notification-1"),
  cancelReminder: jest.fn(async () => {}),
  notifyEventChanged: jest.fn(async () => {}),
}));

const NOW = Date.parse("2026-09-30T09:00:00Z");
const DAY = 86_400_000;
const EMPTY: Cache = { events: {}, venues: {}, cursor: null, lastSyncedAt: null };
const changes = (events = [event()], serverTime = "2026-09-30T09:00:00.000Z") => ({ serverTime, events, venues: [venue()] });

describe("applyChanges (O2, O9)", () => {
  it("adds new events and venues and moves the cursor to the server's time", () => {
    const next = applyChanges(EMPTY, changes(), NOW);
    expect(Object.keys(next.events)).toEqual(["e1"]);
    expect(next.venues.v1.name).toBe("The Blue Room");
    expect(next).toMatchObject({ cursor: "2026-09-30T09:00:00.000Z", lastSyncedAt: NOW });
  });

  it("updates changed events and leaves untouched ones alone", () => {
    const before = applyChanges(EMPTY, changes([event(), event({ id: "e2", title: "Market" })]), NOW);
    const after = applyChanges(before, changes([event({ title: "Jazz Night (late show)" })]), NOW);
    expect(after.events.e1.title).toBe("Jazz Night (late show)");
    expect(after.events.e2.title).toBe("Market");
  });

  it("keeps cancelled events but drops ones pulled back to pending", () => {
    const before = applyChanges(EMPTY, changes([event(), event({ id: "e2" })]), NOW);
    const after = applyChanges(before, changes([event({ status: "cancelled" }), event({ id: "e2", status: "pending" })]), NOW);
    expect(after.events.e1.status).toBe("cancelled");
    expect(after.events.e2).toBeUndefined();
  });

  it("prunes events that ended over 7 days ago, keeping recent ones for Past (F17)", () => {
    const endedAgo = (days: number) => new Date(NOW - days * DAY).toISOString();
    const next = applyChanges(
      EMPTY,
      changes([event({ id: "old", endsAt: endedAgo(8) }), event({ id: "recent", endsAt: endedAgo(6) })]),
      NOW,
    );
    expect(Object.keys(next.events)).toEqual(["recent"]);
  });
});

describe("syncNow", () => {
  // Fresh module instances per test, so failure counts, timers and stores start clean.
  function load() {
    jest.resetModules();
    return {
      api: jest.mocked(require("@/lib/api") as typeof import("@/lib/api")),
      reminders: jest.mocked(require("@/lib/reminders") as typeof import("@/lib/reminders")),
      sync: require("@/lib/sync") as typeof import("@/lib/sync"),
      cache: (require("@/data/cache") as typeof import("@/data/cache")).cache,
      saved: require("@/data/saved") as typeof import("@/data/saved"),
    };
  }

  beforeEach(() => jest.useFakeTimers({ now: NOW }));
  afterEach(() => jest.useRealTimers());

  it("asks only for changes since the last successful sync (O2)", async () => {
    const { api, sync, cache } = load();
    api.fetchChanges.mockResolvedValue(changes());

    await sync.syncNow();
    await sync.syncNow();

    expect(api.fetchChanges.mock.calls.map(([since]) => since)).toEqual([null, "2026-09-30T09:00:00.000Z"]);
    expect(cache.get().events.e1).toBeDefined();
    expect(sync.syncStatus.get()).toEqual({ state: "idle" });
  });

  it("keeps the cache and cursor when a sync fails, so the next one picks up where it left off (O6)", async () => {
    const { api, sync, cache } = load();
    api.fetchChanges.mockResolvedValueOnce(changes()).mockRejectedValueOnce(new Error("offline"));

    await sync.syncNow();
    const before = cache.get();
    await sync.syncNow();

    expect(cache.get()).toBe(before);
    expect(sync.syncStatus.get()).toEqual({ state: "failed", retryAt: NOW + 30_000 });
  });

  it("retries with backoff: 30 s, 2 min, then every 10 min (O6)", async () => {
    const { api, sync } = load();
    api.fetchChanges.mockRejectedValue(new Error("offline"));
    const nextDelay = () => {
      const s = sync.syncStatus.get();
      return s.state === "failed" && s.retryAt !== null ? s.retryAt - Date.now() : null;
    };

    await sync.syncNow();
    const delays = [nextDelay()];
    for (let i = 0; i < 3; i++) {
      await jest.advanceTimersByTimeAsync(nextDelay() ?? 0);
      delays.push(nextDelay());
    }

    expect(delays).toEqual([30_000, 120_000, 600_000, 600_000]);
    expect(api.fetchChanges).toHaveBeenCalledTimes(4);
  });

  it("resets the backoff after a success", async () => {
    const { api, sync } = load();
    api.fetchChanges.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(changes()).mockRejectedValueOnce(new Error("offline"));

    await sync.syncNow();
    await jest.advanceTimersByTimeAsync(30_000); // Retry succeeds.
    await sync.syncNow();

    expect(sync.syncStatus.get()).toEqual({ state: "failed", retryAt: Date.now() + 30_000 });
  });

  it("shares one request between overlapping calls", async () => {
    const { api, sync } = load();
    api.fetchChanges.mockResolvedValue(changes());
    await Promise.all([sync.syncNow(), sync.syncNow()]);
    expect(api.fetchChanges).toHaveBeenCalledTimes(1);
  });

  it("alerts about a saved event that gets cancelled (F13)", async () => {
    const { api, sync, saved, reminders } = load();
    api.fetchChanges.mockResolvedValueOnce(changes()).mockResolvedValueOnce(changes([event({ status: "cancelled" })], "2026-09-30T10:00:00.000Z"));

    await sync.syncNow();
    await saved.saveEvent({ ...event(), venue: venue() });
    await sync.syncNow();

    expect(saved.getSaved().e1.change).toBe("cancelled");
    expect(reminders.notifyEventChanged).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", status: "cancelled" }), "cancelled");
  });
});
