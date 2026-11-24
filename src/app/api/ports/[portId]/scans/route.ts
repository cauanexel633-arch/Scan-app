import { query } from "@/lib/db";
import { bearer, sha256, safeEqual, signPayload, jsonError } from "@/lib/security";
import { scanSchema } from "@/lib/schemas";
import { decryptJson } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ portId: string }> }) {
  const { portId } = await ctx.params;
  const token = bearer(req);
  if (!token) return jsonError("Bearer token obrigatório.", 401);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 4_000) return jsonError("Corpo excede 4 KB.", 413);
  const parsed = scanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Informe requestId e barcode válidos.", 422);

  const { rows: ports } = await query(
    "SELECT id, enabled, token_hash, webhook_url, webhook_secret FROM ports WHERE id = $1",
    [portId]
  );
  const port = ports[0];
  if (!port || !port.enabled) return jsonError("Porta não encontrada ou desativada.", 401);
  const { rows: requests } = await query(
    "SELECT id, external_request_id, scanner_token_hash FROM scan_requests WHERE port_id = $1 AND external_request_id = $2",
    [portId, parsed.data.requestId]
  );
  const scanRequest = requests[0];
  if (!scanRequest) return jsonError("Solicitação não encontrada nesta porta.", 404);
  const isPortToken = safeEqual(port.token_hash, sha256(token));
  const isScannerToken = safeEqual(scanRequest.scanner_token_hash, sha256(token));
  if (!isPortToken && !isScannerToken) return jsonError("Credencial inválida.", 401);

  const eventId = crypto.randomUUID();
  const payload = {
    event: "barcode.scanned", eventId, requestId: scanRequest.external_request_id,
    barcode: parsed.data.barcode, scannedAt: new Date().toISOString()
  };
  await query(
    "INSERT INTO scan_events (id, port_id, request_id, barcode, payload) VALUES ($1, $2, $3, $4, $5::jsonb)",
    [eventId, portId, scanRequest.id, parsed.data.barcode, JSON.stringify(payload)]
  );

  const secret = decryptJson<{ secret: string }>(port.webhook_secret).secret;
  const body = JSON.stringify(payload);
  const signature = signPayload(secret, body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  let responseStatus: number | null = null;
  let failureReason = "";
  try {
    const response = await fetch(port.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Scan-Event": eventId, "X-Scan-Signature": `sha256=${signature}` },
      body, signal: controller.signal, redirect: "error", cache: "no-store"
    });
    responseStatus = response.status;
  } catch (error) {
    failureReason = error instanceof Error ? error.message : "Webhook delivery failed";
  } finally {
    clearTimeout(timer);
  }
  const delivered = responseStatus !== null && responseStatus >= 200 && responseStatus < 300;
  await query(
    "INSERT INTO webhook_deliveries (event_id, port_id, status, http_status, response_excerpt) VALUES ($1, $2, $3, $4, $5)",
    [eventId, portId, delivered ? "delivered" : "failed", responseStatus, failureReason.slice(0, 300)]
  );
  return Response.json({ ok: true, eventId, webhook: { delivered, httpStatus: responseStatus } }, { status: 202 });
}
