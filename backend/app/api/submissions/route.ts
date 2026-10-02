import { getDb } from "@/db";
import { submissionSchema } from "@/lib/contract";
import { json, preflight } from "@/lib/cors";
import { createSubmission } from "@/lib/submissions";

const MAX_BODY_BYTES = 16_000; // a full submission is ~3 KB

/** POST /api/submissions — stores an organiser's event as pending review (F14, F16). */
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return json({ error: "Submission too large" }, 413);

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const parsed = submissionSchema.safeParse(data);
  if (!parsed.success) {
    return json({ error: "Invalid submission", fields: parsed.error.flatten().fieldErrors }, 422);
  }

  const key = request.headers.get("Idempotency-Key");
  if (key && key !== parsed.data.id) return json({ error: "Idempotency-Key must match the submission id" }, 400);

  const created = await createSubmission(getDb(), parsed.data);
  // A retry of something already received is a success too, so the app's queue can clear it.
  return json({ id: parsed.data.id, status: "pending" }, created ? 201 : 200);
}

export const OPTIONS = preflight;
