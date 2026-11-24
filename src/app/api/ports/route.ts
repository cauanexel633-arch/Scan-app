import { getAuthenticatedUser } from "@/lib/auth-session";
import { query } from "@/lib/db";
import { newPortToken, sha256, validWebhookUrl, jsonError } from "@/lib/security";
import { encryptJson } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req.headers);
  if (!user) return jsonError("Não autenticado.", 401);
  const { rows } = await query(
    "SELECT id, name, webhook_url, enabled, created_at FROM ports WHERE user_id = $1 ORDER BY created_at DESC",
    [user.id]
  );
  return Response.json(rows);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req.headers);
  if (!user) return jsonError("Não autenticado.", 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || body.name.trim().length < 2 ||
      body.name.length > 80 || typeof body.webhookUrl !== "string" ||
      !validWebhookUrl(body.webhookUrl)) {
    return jsonError("Informe um nome e um webhook HTTPS permitido. O domínio precisa estar em WEBHOOK_ALLOWED_HOSTS.");
  }
  const token = newPortToken();
  const webhookSecret = newPortToken();
  const { rows } = await query(
    `INSERT INTO ports (user_id, name, webhook_url, token_hash, webhook_secret, enabled)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, name, webhook_url, enabled, created_at`,
    [user.id, body.name.trim(), body.webhookUrl, sha256(token), encryptJson({ secret: webhookSecret })]
  );
  return Response.json({ port: rows[0], token, webhookSecret }, { status: 201 });
}
