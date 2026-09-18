import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import "dotenv/config";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, {
        max: 15,
        idle_timeout: 300,
        connect_timeout: 15,
        ssl: "require",
        prepare: false, // Required for Supabase transaction pooler (port 5432/6543)
      });
      _db = drizzle(_client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to initialize Supabase PostgreSQL connection:", error);
      _db = null;
    }
  }
  return _db;
}

export async function pingDb(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  if (!process.env.DATABASE_URL) return { ok: false, error: "DATABASE_URL not configured" };
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db || !_client) return { ok: false, error: "Database client unavailable" };
    await _client`SELECT 1 as ping`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, error: err.message, latencyMs: Date.now() - start };
  }
}

export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}
