import Link from "next/link";

import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { listPendingSubmissions, listRecentlyReviewed, listUpcomingEvents } from "@/lib/moderation";
import { formatEat } from "@/lib/time";

import { logout } from "./actions";

export const metadata = { title: "Moderation · Around Nairobi admin" };

const DONE: Record<string, string> = {
  approved: "Approved. It reaches phones on their next sync.",
  rejected: "Rejected. Email the organiser the reason (contact is on the submission).",
  saved: "Saved. Phones pick up the change on their next sync.",
};

function hoursSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 3_600_000);
}

export default async function AdminHome(props: PageProps<"/admin">) {
  await requireAdmin();
  const { done } = await props.searchParams;
  const db = getDb();
  const [pending, reviewed, upcoming] = await Promise.all([listPendingSubmissions(db), listRecentlyReviewed(db), listUpcomingEvents(db)]);

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="display">Moderation</h1>
        <form action={logout}>
          <button className="link">Sign out</button>
        </form>
      </header>

      {typeof done === "string" && DONE[done] && (
        <p className="banner ok" role="status">
          {DONE[done]}
        </p>
      )}

      <section>
        <h2>Waiting for review · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className="muted">Nothing to review.</p>
        ) : (
          <ul className="list">
            {pending.map((s) => {
              const waited = hoursSince(s.createdAt);
              return (
                <li key={s.id}>
                  <Link href={`/admin/submissions/${s.id}`} className="item">
                    <strong>{s.title}</strong>
                    <span>
                      {formatEat(s.startsAt)} · {s.venueName}, {s.neighbourhood}
                    </span>
                    {/* The target is a decision within 24 hours of submission. */}
                    <span className={waited >= 20 ? "tag warn" : "tag"}>{waited < 1 ? "just now" : `waiting ${waited} h`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Listed events · {upcoming.length}</h2>
        <ul className="list">
          {upcoming.map(({ event, venue }) => (
            <li key={event.id}>
              <Link href={`/admin/events/${event.id}`} className="item">
                <strong>{event.title}</strong>
                <span>
                  {formatEat(event.startsAt)} · {venue.name}, {venue.neighbourhood}
                </span>
                {event.status !== "published" && <span className={`tag ${event.status}`}>{event.status === "pending" ? "unpublished" : event.status}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2>Recently reviewed</h2>
          <ul className="list compact">
            {reviewed.map((s) => (
              <li key={s.id}>
                <span className={`tag ${s.status}`}>{s.status}</span> {s.title}
                {s.rejectionReason && <span className="muted"> — {s.rejectionReason}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
