import { query } from "@/lib/db";
import { bearer, sha256, safeEqual, newPortToken, jsonError } from "@/lib/security";
import { requestSchema } from "@/lib/schemas";
import { encryptJson } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ portId: string }> }) {
  const { portId } = await ctx.params;
  const token = bearer(req);
  if (!token) return jsonError("Bearer token obrigatório.", 401);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 20_000) return jsonError("Corpo excede 20 KB.", 413);
  const { rows: ports } = await query("SELECT id, enabled, token_hash FROM ports WHERE id = $1", [portId]);
  const port = ports[0];
  if (!port || !port.enabled || !safeEqual(port.token_hash, sha256(token))) {
    return jsonError("Credencial inválida ou porta desativada.", 401);
  }
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("JSON inválido.", 422);
  const requestId = parsed.data.requestId || crypto.randomUUID();
  const scannerToken = newPortToken();
  try {
    const { rows } = await query(
      `INSERT INTO scan_requests (port_id, external_request_id, client_payload, scanner_token_hash, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id, external_request_id, created_at`,
      [portId, requestId, encryptJson(parsed.data.client), sha256(scannerToken)]
    );
    const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    return Response.json({
      ok: true, requestId: rows[0].external_request_id, scanRequestId: rows[0].id, status: "open",
      scannerUrl: `${base}/scan/${portId}/${encodeURIComponent(requestId)}#${scannerToken}`,
      scannerToken
    }, { status: 201 });
  } catch {
    return jsonError("Não foi possível registrar a solicitação. Verifique se o requestId já existe nesta porta.", 409);
  }
}
