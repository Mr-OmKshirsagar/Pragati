# Phase 00 Specification: Architecture & Supabase Foundation

## 1. Metadata
- **Phase**: 00
- **Title**: Architecture & Supabase Foundation Setup
- **Status**: Ready for Implementation
- **Dependencies**: None
- **Target Files**:
  - `backend/.env.example`
  - `backend/.env`
  - `backend/package.json`
  - `backend/src/db.ts`
  - `backend/src/_core/supabase.ts`
  - `backend/drizzle.config.ts`
  - `frontend/package.json`

---

## 2. Objective & Scope
Establish the operational runtime, environment variables, Supabase connection infrastructure, and PostgreSQL Drizzle ORM configuration for PRAGATI in the dedicated `backend/` workspace. Connect the decoupled `frontend/` client to the backend services.

---

## 3. Architecture & Decisions
- **Decoupled Workspaces**:
  - `backend/`: Hosts Express + tRPC API, Supabase Admin client, Drizzle ORM, rule engines, seed scripts, and automated tests.
  - `frontend/`: Hosts React 19 SPA, Vite build, Tailwind CSS v4, and UI components.
- **Database**: Supabase PostgreSQL (hosted or local via Supabase CLI).
- **Client Libraries**:
  - `@supabase/supabase-js` (v2.48+) for storage, auth token validation, and realtime channels.
  - `drizzle-orm` with `postgres` driver (`postgres` package) for strongly-typed relational queries.
- **Fail-Safe Startup**: If `SUPABASE_URL` or `DATABASE_URL` is temporarily missing in local development, the backend logs a structured warning and provides graceful degradation rather than crashing unhandled.

---

## 4. Step-by-Step Implementation Tasks

### 4.1 Initialize & Configure `backend/package.json`
In the `backend/` directory, set up the Node.js TypeScript service:
```bash
cd backend
npm init -y
npm install @supabase/supabase-js postgres drizzle-orm express @trpc/server zod dotenv cors
npm install -D typescript @types/node @types/express @types/pg tsx drizzle-kit vitest
```

### 4.2 Configure Environment Variables (`backend/.env.example` & `backend/.env`)
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

### 4.3 Configure Drizzle for PostgreSQL (`backend/drizzle.config.ts`)
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

### 4.4 Implement Supabase Client Wrapper (`backend/src/_core/supabase.ts`)
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

### 4.5 Implement Database Access Layer (`backend/src/db.ts`)
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
   cd backend && npx tsc --noEmit
   ```
2. Run database connection smoke test:
   ```bash
   cd backend && npx tsx -e "import { getDb } from './src/db'; getDb().then(db => console.log('DB Ready:', !!db));"
   ```
3. Ensure backend dev server starts without throwing unhandled exceptions:
   ```bash
   npm run dev
   ```

---

## 6. Definition of Done
- [ ] Dependencies configured in `backend/package.json`.
- [ ] `backend/drizzle.config.ts` configured for `postgresql`.
- [ ] Supabase admin client initialized in `backend/src/_core/supabase.ts`.
- [ ] Type check passes cleanly with zero errors.
