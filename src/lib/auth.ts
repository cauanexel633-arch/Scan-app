import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
const authPool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://build:build@localhost:5432/build", max: 1, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
export const auth = betterAuth({
  appName: "Scan-app",
  database: authPool,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "scan-app-build-placeholder-secret-change-before-deploy-000000",
  emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 10, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 10 },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  plugins: [nextCookies()]
});
export function assertAuthConfigured() {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) throw new Error("DATABASE_URL e BETTER_AUTH_SECRET precisam estar configurados.");
}
