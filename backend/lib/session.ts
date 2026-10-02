import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// A v1 admin login: one shared password, and a signed, expiring cookie. Swap for per-person accounts before adding moderators.

export const SESSION_COOKIE = "an_admin";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Hash first so lengths match and comparison time doesn't depend on the input.
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function createSessionToken(secret: string, now = Date.now()) {
  const expires = String(now + SESSION_TTL_MS);
  return `${expires}.${sign(expires, secret)}`;
}

export function isValidSessionToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  return safeEqual(signature, sign(expires, secret)) && Number(expires) > now;
}

export function passwordMatches(attempt: string, expected: string) {
  return expected.length > 0 && safeEqual(attempt, expected);
}

/** Reads admin settings; refuses weak or missing values rather than running unprotected. */
export function adminConfig(env: Record<string, string | undefined> = process.env) {
  const password = env.ADMIN_PASSWORD ?? "";
  const secret = env.SESSION_SECRET ?? "";
  if (password.length < 12 || secret.length < 32) return null;
  return { password, secret };
}
