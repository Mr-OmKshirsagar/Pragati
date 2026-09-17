import { config as loadEnv } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are loaded from frontend/.env or backend/.env
loadEnv();
loadEnv({ path: path.resolve(process.cwd(), "../backend/.env"), override: false });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Supabase client will run in mock/unconfigured mode."
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
