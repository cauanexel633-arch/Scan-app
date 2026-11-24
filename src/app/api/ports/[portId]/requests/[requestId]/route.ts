import { createAdminClient } from "@/lib/supabase/admin";
import { bearer, sha256, safeEqual, jsonError } from "@/lib/security";
import { decryptJson } from "@/lib/crypto";
export const runtime="nodejs";
export async function GET(req:Request,ctx:{params:Promise<{portId:string,requestId:string}>}){
 const {portId,requestId}=await ctx.params;const token=bearer(req);if(!token)return jsonError("Token obrigatório.",401);
 const db=createAdminClient();const {data:row}=await db.from("scan_requests").select("id,external_request_id,client_payload,scanner_token_hash,status,created_at,ports!inner(id,token_hash,enabled)").eq("port_id",portId).eq("external_request_id",requestId).maybeSingle();
 if(!row)return jsonError("Solicitação não encontrada.",404);
 const port=row.ports as unknown as {id:string;token_hash:string;enabled:boolean};
 const isPortToken=port.enabled&&safeEqual(port.token_hash,sha256(token));
 const isScannerToken=safeEqual(row.scanner_token_hash,sha256(token));
 if(!isPortToken&&!isScannerToken)return jsonError("Credencial inválida.",401);
 return Response.json({id:row.id,requestId:row.external_request_id,status:row.status,client:decryptJson(row.client_payload)});
}