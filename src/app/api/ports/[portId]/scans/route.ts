import { createAdminClient } from "@/lib/supabase/admin";
import { bearer, sha256, safeEqual, signPayload, jsonError } from "@/lib/security";
import { scanSchema } from "@/lib/schemas";
import { decryptJson } from "@/lib/crypto";
export const runtime="nodejs";
export async function POST(req:Request,ctx:{params:Promise<{portId:string}>}){
 const {portId}=await ctx.params;const token=bearer(req);if(!token)return jsonError("Bearer token obrigatório.",401);
 const length=Number(req.headers.get("content-length")||0);if(length>4000)return jsonError("Corpo excede 4 KB.",413);
 const parsed=scanSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return jsonError("Informe requestId e barcode válidos.",422);
 const db=createAdminClient();const {data:port}=await db.from("ports").select("id,enabled,token_hash,webhook_url,webhook_secret").eq("id",portId).maybeSingle();
 if(!port||!port.enabled)return jsonError("Porta não encontrada ou desativada.",401);
 const {data:request}=await db.from("scan_requests").select("id,external_request_id,scanner_token_hash").eq("port_id",portId).eq("external_request_id",parsed.data.requestId).maybeSingle();
 if(!request)return jsonError("Solicitação não encontrada nesta porta.",404);
 const isPortToken=safeEqual(port.token_hash,sha256(token));const isScannerToken=safeEqual(request.scanner_token_hash,sha256(token));
 if(!isPortToken&&!isScannerToken)return jsonError("Credencial inválida.",401);
 const eventId=crypto.randomUUID();const payload={event:"barcode.scanned",eventId,requestId:request.external_request_id,barcode:parsed.data.barcode,scannedAt:new Date().toISOString()};
 const {error:insertError}=await db.from("scan_events").insert({id:eventId,port_id:portId,request_id:request.id,barcode:parsed.data.barcode,payload});
 if(insertError)return jsonError("Falha ao registrar leitura.",500);
 const secret=decryptJson<{secret:string}>(port.webhook_secret).secret;const body=JSON.stringify(payload);const signature=signPayload(secret,body);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 let responseStatus:number|null=null;let responseBody="";
 try{const response=await fetch(port.webhook_url,{method:"POST",headers:{"Content-Type":"application/json","X-Scan-Event":eventId,"X-Scan-Signature":`sha256=${signature}`},body,signal:controller.signal,redirect:"error",cache:"no-store"});responseStatus=response.status;responseBody=(await response.text()).slice(0,1000);}
 catch(e){responseBody=e instanceof Error?e.message:"Webhook delivery failed";}
 finally{clearTimeout(timer);}
 const delivered=responseStatus!==null&&responseStatus>=200&&responseStatus<300;
 await db.from("webhook_deliveries").insert({event_id:eventId,port_id:portId,status:delivered?"delivered":"failed",http_status:responseStatus,response_excerpt:responseBody});
 return Response.json({ok:true,eventId,webhook:{delivered,httpStatus:responseStatus}}, {status:202});
}