import "dotenv/config";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

async function verify() {
  console.log("==================================================");
  console.log("       PRAGATI ENVIRONMENT & CONNECTION TEST      ");
  console.log("==================================================\n");

  // 1. Environment Variables Inspection
  console.log("1. Environment Variables Check:");
  console.log("   - SUPABASE_URL:             ", process.env.SUPABASE_URL || "[EMPTY]");
  console.log("   - SUPABASE_ANON_KEY:        ", process.env.SUPABASE_ANON_KEY ? `[PRESENT, length: ${process.env.SUPABASE_ANON_KEY.length}]` : "[EMPTY]");
  console.log("   - SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? `[PRESENT, length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length}]` : "[EMPTY]");
  console.log("   - DATABASE_URL:             ", process.env.DATABASE_URL ? `[CONFIGURED: ${process.env.DATABASE_URL.slice(0, 35)}...]` : "[EMPTY]");
  console.log("   - GEMINI_API_KEY:           ", process.env.GEMINI_API_KEY ? `[PRESENT, length: ${process.env.GEMINI_API_KEY.length}]` : "[EMPTY]");
  console.log("   - GEMINI_MODEL:             ", process.env.GEMINI_MODEL || "gemini-1.5-flash");

  // 2. Test Direct PostgreSQL Connection
  console.log("\n2. Testing PostgreSQL Pooler Connection...");
  if (!process.env.DATABASE_URL) {
    console.log("   ❌ DATABASE_URL is missing.");
  } else {
    try {
      const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 10 });
      const result = await sql`SELECT 1 as connected, current_database(), current_user, version();`;
      console.log("   ✅ PostgreSQL Direct Connection: SUCCESS");
      console.log("      - Database: ", result[0].current_database);
      console.log("      - User:     ", result[0].current_user);
      console.log("      - Engine:   ", result[0].version?.slice(0, 40) + "...");
      await sql.end();
    } catch (err: any) {
      console.log("   ❌ PostgreSQL Connection FAILED:", err.message);
    }
  }

  // 3. Test Supabase Public (Anon) Client
  console.log("\n3. Testing Supabase Public Client (Anon Key)...");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log("   ❌ SUPABASE_URL or SUPABASE_ANON_KEY is missing.");
  } else {
    try {
      const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      // Attempt a ping/health read
      const { data, error } = await supabaseAnon.auth.getSession();
      if (error) {
        console.log("   ❌ Supabase Anon Auth check failed:", error.message);
      } else {
        console.log("   ✅ Supabase Public Client (Anon): VALID & REACHABLE");
      }
    } catch (err: any) {
      console.log("   ❌ Supabase Anon Request failed:", err.message);
    }
  }

  // 4. Test Supabase Admin (Service Role) Client
  console.log("\n4. Testing Supabase Admin Client (Service Role Key)...");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("   ❌ SUPABASE_SERVICE_ROLE_KEY is missing.");
  } else {
    try {
      const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (userError) {
        console.log("   ❌ Service Role Auth API error:", userError.message);
      } else {
        console.log("   ✅ Supabase Admin (Service Role): AUTHENTICATED & VERIFIED");
        console.log(`      - Users in Auth directory: ${users.users.length}`);
      }

      // Check Storage Bucket API access
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
      if (bucketError) {
        console.log("   ⚠️ Supabase Storage Buckets check:", bucketError.message);
      } else {
        console.log("   ✅ Supabase Storage API: ACCESSIBLE");
        console.log(`      - Existing buckets: [${buckets.map(b => b.name).join(", ")}]`);
      }
    } catch (err: any) {
      console.log("   ❌ Supabase Admin Request failed:", err.message);
    }
  }

  // 5. Test Google Gemini AI API Key
  console.log("\n5. Testing Google Gemini AI API Key...");
  if (!process.env.GEMINI_API_KEY) {
    console.log("   ❌ GEMINI_API_KEY is missing.");
  } else {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const data = await res.json();
      if (res.ok) {
        console.log("   ✅ Google Gemini AI API Key: VALID & AUTHENTICATED");
        const models = data.models ? data.models.slice(0, 4).map((m: any) => m.name.replace("models/", "")) : [];
        console.log("      - Sample Available Models:", models.join(", "));
      } else {
        console.log("   ❌ Gemini API Error:", data.error?.message || JSON.stringify(data));
      }
    } catch (err: any) {
      console.log("   ❌ Gemini Request Failed:", err.message);
    }
  }

  console.log("\n==================================================");
  console.log("               ALL TESTS COMPLETED                ");
  console.log("==================================================");
}

verify().catch(console.error);
