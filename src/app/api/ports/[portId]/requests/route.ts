import { createAdminClient } from "@/lib/supabase/admin";
import { bearer, sha256, safeEqual, newPortToken, jsonError } from "@/lib/security";
import { requestSchema } from "@/lib/schemas";
import { encryptJson } from "@/lib/crypto";
export const runtime="nodejs";
export async function POST(req:Request,ctx:{params:Promise<{portId:string}>}){
 const {portId}=await ctx.params;const token=bearer(req);if(!token)return jsonError("Bearer token obrigatório.",401);
 const db=createAdminClient();const {data:port}=await db.from("ports").select("id,enabled,token_hash").eq("id",portId).maybeSingle();
 if(!port||!port.enabled||!safeEqual(port.token_hash,sha256(token)))return jsonError("Credencial inválida ou porta desativada.",401);
 const length=Number(req.headers.get("content-length")||0);if(length>20000)return jsonError("Corpo excede 20 KB.",413);
 const parsed=requestSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return jsonError("JSON inválido.",422);
 const requestId=parsed.data.requestId||crypto.randomUUID();const scannerToken=newPortToken();
 const {data,error}=await db.from("scan_requests").insert({port_id:portId,external_request_id:requestId,client_payload:encryptJson(parsed.data.client),scanner_token_hash:sha256(scannerToken),status:"open"}).select("id,external_request_id,created_at").single();
 if(error)return jsonError("Não foi possível registrar a solicitação. Verifique se o requestId já existe nesta porta.",409);
 const base=(process.env.NEXT_PUBLIC_APP_URL||"").replace(/\/$/,"");
 return Response.json({ok:true,requestId:data.external_request_id,scanRequestId:data.id,status:"open",scannerUrl:`${base}/scan/${portId}/${encodeURIComponent(requestId)}#${scannerToken}`,scannerToken}, {status:201});
}