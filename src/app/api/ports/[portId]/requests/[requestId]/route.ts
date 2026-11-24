import { query } from "@/lib/db";
import { bearer, sha256, safeEqual, jsonError } from "@/lib/security";
import { decryptJson } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ portId: string; requestId: string }> }) {
  const { portId, requestId } = await ctx.params;
  const token = bearer(req);
  if (!token) return jsonError("Token obrigatório.", 401);
  const { rows } = await query(
    `SELECT r.id, r.external_request_id, r.client_payload, r.scanner_token_hash, r.status,
            p.token_hash, p.enabled
     FROM scan_requests r JOIN ports p ON p.id = r.port_id
     WHERE r.port_id = $1 AND r.external_request_id = $2 LIMIT 1`,
    [portId, requestId]
  );
  const row = rows[0];
  if (!row) return jsonError("Solicitação não encontrada.", 404);
  const isPortToken = row.enabled && safeEqual(row.token_hash, sha256(token));
  const isScannerToken = safeEqual(row.scanner_token_hash, sha256(token));
  if (!isPortToken && !isScannerToken) return jsonError("Credencial inválida.", 401);
  return Response.json({
    id: row.id, requestId: row.external_request_id, status: row.status,
    client: decryptJson(row.client_payload)
  });
}
