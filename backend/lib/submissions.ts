import type { Db } from "@/db";
import { submissions } from "@/db/schema";

import type { SubmissionInput } from "./contract";

/** Stores a submission as pending (F16). Returns false if this id was already received, so retries are harmless. */
export async function createSubmission(db: Db, input: SubmissionInput): Promise<boolean> {
  const inserted = await db
    .insert(submissions)
    .values({ ...input, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt) })
    .onConflictDoNothing({ target: submissions.id })
    .returning({ id: submissions.id });
  return inserted.length > 0;
}
