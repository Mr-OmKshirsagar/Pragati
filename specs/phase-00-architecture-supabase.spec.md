# Phase 00 Specification: Architecture & Supabase Foundation

## 1. Metadata
- **Phase**: 00
- **Title**: Architecture & Supabase Foundation Setup
- **Status**: Ready for Implementation
- **Dependencies**: None
- **Target Files**:
  - `frontend/.env.example`
  - `frontend/package.json`
  - `frontend/server/db.ts`
  - `frontend/server/_core/supabase.ts`
  - `frontend/drizzle.config.ts`

---

## 2. Objective & Scope
Establish the operational runtime, environment variables, Supabase connection infrastructure, and PostgreSQL Drizzle ORM configuration for PRAGATI. Replace the legacy MySQL template configuration with Supabase PostgreSQL.

---

## 3. Architecture & Decisions
- **Database**: Supabase PostgreSQL (hosted or local via Supabase CLI).
- **Client Libraries**:
  - `@supabase/supabase-js` (v2.48+) for storage, auth token validation, and realtime channels.
  - `drizzle-orm` (v0.38+) with `postgres` driver (`postgres` package) for strongly-typed relational queries.
- **Fail-Safe Startup**: If `SUPABASE_URL` or `DATABASE_URL` is temporarily missing in local development, the backend must log a structured warning and provide health degradation rather than crashing unhandled.

---

## 4. Step-by-Step Implementation Tasks

### 4.1 Update Dependencies in `frontend/package.json`
Remove MySQL dependencies and install Supabase & PostgreSQL packages:
```bash
cd frontend
npm remove mysql2
npm install @supabase/supabase-js postgres
npm install -D @types/pg
```

### 4.2 Configure Environment Variables
Create `frontend/.env.example` and `.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Storage
SUPABASE_STORAGE_BUCKET=evidence-vault

# AI Layer (Gemini)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

### 4.3 Configure Drizzle for PostgreSQL (`frontend/drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
```

### 4.4 Implement Supabase Client Wrapper (`frontend/server/_core/supabase.ts`)
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Storage and Auth features will be disabled.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

### 4.5 Implement Database Access Layer (`frontend/server/db.ts`)
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { max: 10 });
      _db = drizzle(client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect to Supabase PostgreSQL:", error);
      _db = null;
    }
  }
  return _db;
}
```

---

## 5. Verification & Acceptance Tests
1. Run TypeScript check:
   ```bash
   cd frontend && npm run check
   ```
2. Run database connection smoke test:
   ```bash
   npx tsx -e "import { getDb } from './server/db'; getDb().then(db => console.log('DB Ready:', !!db));"
   ```
3. Ensure server starts without throwing unhandled exceptions:
   ```bash
   npm run dev
   ```

---

## 6. Definition of Done
- [ ] Dependencies updated (`mysql2` removed, `postgres` & `@supabase/supabase-js` installed).
- [ ] `drizzle.config.ts` configured for `postgresql`.
- [ ] Supabase admin client initialized with graceful fallback logging.
- [ ] Type check passes cleanly with zero errors.
