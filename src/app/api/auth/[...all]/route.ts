import { toNextJsHandler } from "better-auth/next-js";
import { auth, assertAuthConfigured } from "@/lib/auth";
const handlers = toNextJsHandler(auth);
async function run(handler: (request: Request) => Promise<Response>, request: Request) {
  try { assertAuthConfigured(); return await handler(request); }
  catch (error) {
    console.error("Auth endpoint unavailable:", error instanceof Error ? error.message : "unknown");
    return Response.json({ message: "Autenticação temporariamente indisponível." }, { status: 503 });
  }
}
export const GET = (request: Request) => run(handlers.GET, request);
export const POST = (request: Request) => run(handlers.POST, request);
