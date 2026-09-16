import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";

async function applyRLS() {
  console.log("=== Applying Row Level Security (RLS) Policies to Supabase ===");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to apply RLS policies.");
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const rlsFilePath = path.join(process.cwd(), "drizzle", "rls_policies.sql");
  const rawSql = fs.readFileSync(rlsFilePath, "utf-8");

  // Clean and split SQL commands by semicolon
  const statements = rawSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let appliedCount = 0;
  let skippedCount = 0;

  for (const statement of statements) {
    try {
      await sql.unsafe(statement);
      appliedCount++;
    } catch (err: any) {
      // If policy already exists, log and proceed idempotently
      if (err.code === "42710") {
        // duplicate_object (policy already exists)
        skippedCount++;
      } else {
        console.warn(`[RLS Warning] Statement failed: ${err.message}`);
      }
    }
  }

  console.log(`✅ RLS Policies Applied: ${appliedCount} applied, ${skippedCount} already present.`);

  // Verify RLS status on tables
  const rlsStatus = await sql`
    SELECT relname as table_name, relrowsecurity as rls_enabled
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND relkind = 'r'
    ORDER BY relname;
  `;

  console.log(`Total Public Tables: ${rlsStatus.length}`);
  const securedTables = rlsStatus.filter((t) => t.rls_enabled);
  console.log(`Tables with RLS Enabled: ${securedTables.length} / ${rlsStatus.length}`);

  await sql.end();
}

applyRLS().catch(console.error);
