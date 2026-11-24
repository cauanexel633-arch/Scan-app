import { auth, assertAuthConfigured } from "@/lib/auth";
export async function getAuthenticatedUser(headers: Headers) {
  assertAuthConfigured();
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}
