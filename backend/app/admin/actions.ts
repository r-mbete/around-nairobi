"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { approveSubmission, ModerationError, rejectSubmission, setEventStatus, updateEvent } from "@/lib/moderation";
import { type FormState, parseReview, readValues } from "@/lib/review-form";
import { adminConfig, createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

// Every action re-checks the session: Server Actions can be called by direct POST, not just from our pages.

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const config = adminConfig();
  if (!config) return { error: "Admin login isn't set up. Set ADMIN_PASSWORD (12+ characters) and SESSION_SECRET (32+) in backend/.env.local." };
  if (!passwordMatches(String(form.get("password") ?? ""), config.password)) return { error: "That password isn't right." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

function failure(error: unknown, values: FormState["values"]): FormState {
  if (error instanceof ModerationError) return { error: error.message, values };
  throw error;
}

export async function approve(submissionId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const values = readValues(form);
  const parsed = parseReview(values);
  if (!parsed.ok) return parsed.state;
  try {
    await approveSubmission(getDb(), submissionId, parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/admin");
  redirect("/admin?done=approved");
}

export async function reject(submissionId: string, _prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await rejectSubmission(getDb(), submissionId, String(form.get("reason") ?? ""));
  } catch (error) {
    if (error instanceof ModerationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin");
  redirect("/admin?done=rejected");
}

export async function saveEvent(eventId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const values = readValues(form);
  const parsed = parseReview(values);
  if (!parsed.ok) return parsed.state;
  try {
    await updateEvent(getDb(), eventId, parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/admin");
  redirect("/admin?done=saved");
}

const STATUSES = ["published", "cancelled", "pending"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function changeStatus(eventId: string, status: (typeof STATUSES)[number]) {
  await requireAdmin();
  if (!UUID.test(eventId) || !STATUSES.includes(status)) throw new Error("Bad request");
  await setEventStatus(getDb(), eventId, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
}
