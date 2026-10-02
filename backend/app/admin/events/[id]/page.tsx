import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getEventWithVenue } from "@/lib/moderation";
import { valuesFromEvent } from "@/lib/review-form";

import { changeStatus, saveEvent } from "../../actions";
import { ReviewForm } from "../../review-form";

export const metadata = { title: "Edit event · Around Nairobi admin" };

export default async function EditEvent(props: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await getEventWithVenue(getDb(), id);
  if (!row) notFound();
  const { event, venue } = row;

  return (
    <main className="page">
      <Link href="/admin" className="link">
        ← Moderation
      </Link>
      <h1 className="display">{event.title}</h1>

      <section className="status">
        <p>
          Status: <span className={`tag ${event.status}`}>{event.status === "pending" ? "unpublished" : event.status}</span>
        </p>
        <div className="actions">
          {event.status !== "cancelled" && (
            <form action={changeStatus.bind(null, event.id, "cancelled")}>
              <button className="button danger">Cancel event</button>
            </form>
          )}
          {event.status !== "published" && (
            <form action={changeStatus.bind(null, event.id, "published")}>
              <button className="button">Publish again</button>
            </form>
          )}
          {event.status !== "pending" && (
            <form action={changeStatus.bind(null, event.id, "pending")}>
              <button className="button">Unpublish</button>
            </form>
          )}
        </div>
        <p className="hint">
          Cancelled events stay in the app marked as cancelled, and people who saved them are told. Unpublishing removes the event from phones.
        </p>
      </section>

      <section>
        <h2>Edit details</h2>
        <ReviewForm action={saveEvent.bind(null, event.id)} defaults={valuesFromEvent(event, venue)} submitLabel="Save changes" />
      </section>
    </main>
  );
}
