import cors from "cors";
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { isSupabaseConfigured } from "./_core/supabase";
import { isDatabaseConfigured, pingDb } from "./db";

export const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(origin => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Core Middlewares: Permissive and intelligent CORS for Vercel, localhost & custom domains
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, health probes)
      if (!origin) return callback(null, true);

      const clean = origin.replace(/\/$/, "");
      // Allow local development
      if (clean.includes("localhost") || clean.includes("127.0.0.1")) {
        return callback(null, true);
      }
      // Allow all Vercel deployments (*.vercel.app)
      if (clean.endsWith(".vercel.app") || clean === "https://vercel.app") {
        return callback(null, true);
      }
      // Allow explicitly configured origins
      if (allowedOrigins.length === 0 || allowedOrigins.includes(clean)) {
        return callback(null, true);
      }
      // Permissive fallback so browser requests are never blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source", "Cookie"],
  })
);
app.options("*", cors());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Request Logger
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "test") {
    console.log(`[API] ${req.method} ${req.path} - ${duration}ms`);
  }
});

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";

// Mount tRPC API endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health & System Status Endpoint (Live Supabase & PostgreSQL ping)
app.get("/health", async (_req: Request, res: Response) => {
  const dbPing = await pingDb();
  res.status(dbPing.ok ? 200 : 503).json({
    status: dbPing.ok ? "ok" : "degraded",
    service: "pragati-backend",
    phase: "00-architecture-supabase",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      configured: isDatabaseConfigured,
      connected: dbPing.ok,
      latencyMs: dbPing.latencyMs,
      error: dbPing.error,
      driver: "postgres",
      orm: "drizzle-orm",
    },
    supabase: {
      configured: isSupabaseConfigured,
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "evidence-vault",
    },
  });
});

// Root ping
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "PRAGATI Institutional Platform Backend API",
    version: "1.0.0",
    docs: "/health",
  });
});

// Server Listener (skip if running in test environment)
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`[PRAGATI Backend] Server running on http://localhost:${PORT}/`);
    console.log(
      `[PRAGATI Backend] Supabase Status: ${
        isSupabaseConfigured ? "Connected" : "Unconfigured (Placeholder mode)"
      }`
    );
    console.log(
      `[PRAGATI Backend] Database Status: ${
        isDatabaseConfigured ? "Connected" : "Unconfigured (Graceful degradation)"
      }`
    );
  });
}
