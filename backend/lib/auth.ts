import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminConfig, isValidSessionToken, SESSION_COOKIE } from "./session";

/** Guards every admin page and Server Action; actions are reachable by direct POST, so each one must call this. */
export async function requireAdmin() {
  const config = adminConfig();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!config || !isValidSessionToken(token, config.secret)) redirect("/admin/login");
}
