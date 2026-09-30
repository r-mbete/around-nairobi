import { submitEvent, type Submission } from "@/lib/api";
import { createStore } from "@/lib/store";

export type QueuedSubmission = { submission: Submission; queuedAt: number; attempts: number };

type Outbox = { queue: QueuedSubmission[]; sentCount: number };

/** Submissions waiting to be sent; survives restarts so nothing typed offline is lost (F15, O8). */
const outbox = createStore<Outbox>({ queue: [], sentCount: 0 }, { key: "outbox.v1" });

export const useOutbox = outbox.use;

export function enqueueSubmission(submission: Submission) {
  outbox.set((o) => ({ ...o, queue: [...o.queue, { submission, queuedAt: Date.now(), attempts: 0 }] }));
}

export function isQueued(id: string) {
  return outbox.get().queue.some((q) => q.submission.id === id);
}

let flushing: Promise<void> | null = null;

/** Sends queued submissions oldest first, stopping at the first failure (usually: still offline). */
export function flushOutbox(): Promise<void> {
  flushing ??= (async () => {
    try {
      for (;;) {
        const next = outbox.get().queue[0];
        if (!next) return;
        try {
          await submitEvent(next.submission);
        } catch {
          outbox.set((o) => ({ ...o, queue: o.queue.map((q) => (q === next ? { ...q, attempts: q.attempts + 1 } : q)) }));
          return;
        }
        outbox.set((o) => ({ queue: o.queue.filter((q) => q.submission.id !== next.submission.id), sentCount: o.sentCount + 1 }));
      }
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}
