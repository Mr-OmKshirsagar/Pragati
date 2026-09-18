import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { COOKIE_NAME } from "@shared/const";
import type { AppRouter } from "../../../../backend/src/routers";

function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return `${envUrl.trim().replace(/\/$/, "")}/api/trpc`;
  }
  // When hosted on Vercel or in local dev, relative path /api/trpc is proxied
  return "/api/trpc";
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      transformer: superjson,
      headers() {
        try {
          const customToken =
            localStorage.getItem("pragati_token") ||
            sessionStorage.getItem("pragati_token");
          if (customToken) {
            return { Authorization: `Bearer ${customToken}` };
          }

          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // storage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
