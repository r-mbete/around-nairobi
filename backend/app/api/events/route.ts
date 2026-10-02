import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { json, preflight } from "@/lib/cors";
import { getChanges } from "@/lib/feed";

/** GET /api/events?updatedSince=<ISO> — the delta the app syncs from (O2). */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("updatedSince");
  let since: Date | null = null;
  if (raw) {
    since = new Date(raw);
    if (Number.isNaN(since.getTime())) return json({ error: "updatedSince must be an ISO date-time" }, 400);
  }

  const changes = await getChanges(getDb(), since);
  // Listings change rarely, but a cached delta could hide an edit, so tell proxies not to store it.
  return json(changes, 200, { "Cache-Control": "no-store" });
}

export const OPTIONS = preflight;
