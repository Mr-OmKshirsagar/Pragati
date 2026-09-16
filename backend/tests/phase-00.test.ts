import { describe, expect, it } from "vitest";
import { supabaseAdmin, isSupabaseConfigured } from "../src/_core/supabase";
import { getDb, isDatabaseConfigured } from "../src/db";
import { app } from "../src/index";

describe("Phase 00: Architecture & Supabase Foundation Setup", () => {
  it("should initialize Supabase client safely in placeholder or configured mode", () => {
    expect(supabaseAdmin).toBeDefined();
    expect(typeof supabaseAdmin.from).toBe("function");
    expect(typeof isSupabaseConfigured).toBe("boolean");
  });

  it("should handle getDb gracefully without crashing when credentials are unset", async () => {
    const db = await getDb();
    if (isDatabaseConfigured) {
      expect(db).toBeDefined();
    } else {
      expect(db).toBeNull();
    }
  });

  it("should provide an operational Express application instance", () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });

  it("should serve /health endpoint returning system status", async () => {
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 3001;

    try {
      const res = await fetch(`http://localhost:${port}/health`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as Record<string, any>;
      expect(data.status).toBe("ok");
      expect(data.service).toBe("pragati-backend");
      expect(data.phase).toBe("00-architecture-supabase");
      expect(data.database.driver).toBe("postgres");
      expect(data.database.orm).toBe("drizzle-orm");
    } finally {
      server.close();
    }
  });
});
