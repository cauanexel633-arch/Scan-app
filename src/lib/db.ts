import { Pool, type QueryResultRow } from "pg";
const connectionString = process.env.DATABASE_URL || "postgresql://build:build@localhost:5432/build";
const globalForPg = globalThis as typeof globalThis & { scanPool?: Pool };
export const pool = globalForPg.scanPool ?? new Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
if (process.env.NODE_ENV !== "production") globalForPg.scanPool = pool;
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) { return pool.query<T>(text, values); }
