import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { findVenue, getSubmission } from "@/lib/moderation";
import { valuesFromSubmission } from "@/lib/review-form";
import { formatEat } from "@/lib/time";

import { approve, reject } from "../../actions";
import { ReviewForm } from "../../review-form";
import { RejectForm } from "../../small-forms";

export const metadata = { title: "Review submission · Around Nairobi admin" };

export default async function ReviewSubmission(props: PageProps<"/admin/submissions/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const db = getDb();
  const submission = await getSubmission(db, id);
  if (!submission) notFound();
  const knownVenue = await findVenue(db, submission.venueName, submission.neighbourhood);

  return (
    <main className="page">
      <Link href="/admin" className="link">
        ← All submissions
      </Link>
      <h1 className="display">{submission.title}</h1>
      <p className="lede">
        Submitted {formatEat(submission.createdAt)} · contact <strong>{submission.contact}</strong>{" "}
        <span className="muted">(moderators only, never shown in the app)</span>
      </p>

      {submission.status !== "pending" ? (
        <p className="banner">
          Already {submission.status}
          {submission.rejectionReason ? `: ${submission.rejectionReason}` : "."}
        </p>
      ) : (
        <>
          <section>
            <h2>Check, fix and approve</h2>
            {knownVenue ? (
              <p className="hint">Matched an existing venue, so its address and coordinates are filled in.</p>
            ) : (
              <p className="hint">New venue: add its coordinates before approving.</p>
            )}
            <ReviewForm action={approve.bind(null, submission.id)} defaults={valuesFromSubmission(submission, knownVenue)} submitLabel="Approve and publish" />
          </section>

          <section>
            <h2>Or reject</h2>
            <RejectForm action={reject.bind(null, submission.id)} />
          </section>
        </>
      )}
    </main>
  );
}
