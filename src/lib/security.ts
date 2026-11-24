import { createHash, randomBytes, createHmac, timingSafeEqual } from "node:crypto";
export function newPortToken() { return "scan_" + randomBytes(32).toString("base64url"); }
export function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function signPayload(secret: string, body: string) { return createHmac("sha256", secret).update(body).digest("hex"); }
export function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function bearer(req: Request) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") || "");
  return match?.[1]?.trim() || null;
}
export function validWebhookUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { return false; }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host === "127.0.0.1" || host === "::1" || host.startsWith("10.") ||
      host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "0.0.0.0" || host.startsWith("169.254.") || host.includes(":")) return false;
  const allowed = (process.env.WEBHOOK_ALLOWED_HOSTS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(host);
}
export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status }); }