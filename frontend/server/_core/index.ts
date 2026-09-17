import { config as loadEnv } from "dotenv";
import path from "path";
loadEnv();
loadEnv({ path: path.resolve(process.cwd(), "../backend/.env"), override: false });
process.env.NODE_ENV = process.env.NODE_ENV || "development";
import express from "express";
import http, { createServer } from "http";
import https from "https";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const useMock = process.env.USE_MOCK_ROUTER === "true";

  if (!useMock) {
    console.log(`[Frontend Gateway] Proxying /api/trpc requests to live backend at ${BACKEND_URL}`);
    app.use("/api/trpc", (req, res) => {
      const backendUrl = new URL(BACKEND_URL);
      const isHttps = backendUrl.protocol === "https:";
      const client = isHttps ? https : http;

      const options: http.RequestOptions = {
        hostname: backendUrl.hostname,
        port: backendUrl.port || (isHttps ? 443 : 80),
        path: `/api/trpc${req.url}`,
        method: req.method,
        headers: {
          ...req.headers,
          host: backendUrl.host,
        },
      };

      const proxyReq = client.request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on("error", err => {
        console.error(`[Gateway Proxy Error] Failed to reach backend at ${BACKEND_URL}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            error: "Backend Service Unavailable",
            message: `Could not connect to PRAGATI backend at ${BACKEND_URL}. Ensure backend is running on port 3001.`,
          });
        }
      });

      req.pipe(proxyReq, { end: true });
    });
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Fallback mock tRPC API
  if (useMock) {
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );
  }
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.FRONTEND_PORT || (process.env.PORT === "3001" ? "3000" : (process.env.PORT || "3000")));
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
