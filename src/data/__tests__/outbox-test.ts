import { enqueueSubmission, flushOutbox, isQueued } from "@/data/outbox";
import { submitEvent, type Submission } from "@/lib/api";
import { storage } from "@/lib/storage";

jest.mock("@/lib/api", () => ({ submitEvent: jest.fn(async () => {}) }));

const send = jest.mocked(submitEvent);
const submission = (id: string) => ({ id, title: `Event ${id}` }) as Submission;
const sentIds = () => send.mock.calls.map(([s]) => s.id);

afterEach(async () => {
  send.mockReset();
  send.mockResolvedValue(undefined);
  await flushOutbox(); // Empty the queue between tests.
  send.mockClear();
});

describe("submission queue (F15)", () => {
  it("sends queued submissions oldest first and empties the queue", async () => {
    enqueueSubmission(submission("a"));
    enqueueSubmission(submission("b"));
    await flushOutbox();

    expect(sentIds()).toEqual(["a", "b"]);
    expect(isQueued("a") || isQueued("b")).toBe(false);
  });

  it("stops at the first failure and keeps everything not yet sent", async () => {
    send.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("offline"));
    ["a", "b", "c"].forEach((id) => enqueueSubmission(submission(id)));
    await flushOutbox();

    expect(sentIds()).toEqual(["a", "b"]);
    expect([isQueued("a"), isQueued("b"), isQueued("c")]).toEqual([false, true, true]);
  });

  it("sends the rest once the connection is back", async () => {
    send.mockRejectedValueOnce(new Error("offline"));
    enqueueSubmission(submission("a"));
    await flushOutbox();
    expect(isQueued("a")).toBe(true);

    await flushOutbox();
    expect(isQueued("a")).toBe(false);
    expect(sentIds()).toEqual(["a", "a"]);
  });

  it("doesn't double-send when flushes overlap", async () => {
    enqueueSubmission(submission("a"));
    await Promise.all([flushOutbox(), flushOutbox(), flushOutbox()]);
    expect(sentIds()).toEqual(["a"]);
  });

  it("keeps the queue on the device so it survives a restart (O8)", () => {
    send.mockRejectedValue(new Error("offline"));
    enqueueSubmission(submission("saved-offline"));
    expect(storage.get("outbox.v1")).toContain("saved-offline");
  });
});
