import { getAuthenticatedUser } from "@/lib/auth-session";
import { query } from "@/lib/db";
import { validWebhookUrl, jsonError } from "@/lib/security";

type Ctx = { params: Promise<{ portId: string }> };

async function ownedPort(req: Request, portId: string) {
  const user = await getAuthenticatedUser(req.headers);
  if (!user) return { response: jsonError("Não autenticado.", 401) } as const;
  const { rows } = await query("SELECT id FROM ports WHERE id = $1 AND user_id = $2", [portId, user.id]);
  if (!rows[0]) return { response: jsonError("Porta não encontrada.", 404) } as const;
  return { user } as const;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { portId } = await ctx.params;
  const owner = await ownedPort(req, portId);
  if ("response" in owner) return owner.response;
  const body = await req.json().catch(() => null);
  const fields: string[] = [];
  const values: unknown[] = [];
  if (typeof body?.name === "string" && body.name.trim().length >= 2 && body.name.length <= 80) {
    values.push(body.name.trim()); fields.push(`name = $${values.length}`);
  }
  if (typeof body?.enabled === "boolean") {
    values.push(body.enabled); fields.push(`enabled = $${values.length}`);
  }
  if (typeof body?.webhookUrl === "string") {
    if (!validWebhookUrl(body.webhookUrl)) return jsonError("Webhook HTTPS inválido ou não permitido.");
    values.push(body.webhookUrl); fields.push(`webhook_url = $${values.length}`);
  }
  if (!fields.length) return jsonError("Nenhuma alteração válida.");
  values.push(portId, owner.user.id);
  const { rows } = await query(
    `UPDATE ports SET ${fields.join(", ")} WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING id, name, webhook_url, enabled, created_at`,
    values
  );
  return rows[0] ? Response.json(rows[0]) : jsonError("Porta não encontrada.", 404);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { portId } = await ctx.params;
  const owner = await ownedPort(req, portId);
  if ("response" in owner) return owner.response;
  await query("DELETE FROM ports WHERE id = $1 AND user_id = $2", [portId, owner.user.id]);
  return Response.json({ ok: true });
}
