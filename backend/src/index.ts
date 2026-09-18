import cors from "cors";
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { isSupabaseConfigured } from "./_core/supabase";
import { isDatabaseConfigured } from "./db";

export const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

// Core Middlewares
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
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

// Health & System Status Endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "pragati-backend",
    phase: "00-architecture-supabase",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      configured: isDatabaseConfigured,
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
