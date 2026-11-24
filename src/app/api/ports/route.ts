import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newPortToken, sha256, validWebhookUrl, jsonError } from "@/lib/security";
import { encryptJson } from "@/lib/crypto";
export const runtime = "nodejs";
export async function GET() {
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return jsonError("Não autenticado.",401);
 const db=createAdminClient();const {data,error}=await db.from("ports").select("id,name,webhook_url,enabled,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
 if(error)return jsonError("Falha ao consultar portas.",500);return Response.json(data);
}
export async function POST(req:Request) {
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return jsonError("Não autenticado.",401);
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.name!=="string"||body.name.trim().length<2||body.name.length>80||typeof body.webhookUrl!=="string"||!validWebhookUrl(body.webhookUrl))return jsonError("Informe um nome e um webhook HTTPS permitido. O domínio precisa estar em WEBHOOK_ALLOWED_HOSTS.");
 const token=newPortToken();const webhookSecret=newPortToken();const db=createAdminClient();
 const {data,error}=await db.from("ports").insert({user_id:user.id,name:body.name.trim(),webhook_url:body.webhookUrl,token_hash:sha256(token),webhook_secret:encryptJson({secret:webhookSecret}),enabled:true}).select("id,name,webhook_url,enabled,created_at").single();
 if(error)return jsonError("Não foi possível criar a porta.",500);
 return Response.json({port:data,token,webhookSecret},{status:201});
}