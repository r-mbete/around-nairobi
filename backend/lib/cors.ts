// The public API carries no cookies or secrets, so any origin may call it (the app's web preview runs on another port).
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...CORS_HEADERS, ...headers } });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
