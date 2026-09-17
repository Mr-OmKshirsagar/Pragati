import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";

describe("SDK Authentication & Demo Tokens", () => {
  it("silently returns null when session cookie or token is missing", async () => {
    const session = await sdk.verifySession(null);
    expect(session).toBeNull();

    const emptySession = await sdk.verifySession("");
    expect(emptySession).toBeNull();
  });

  it("verifies demo persona tokens without compact JWS errors", async () => {
    const session = await sdk.verifySession("demo_STUDENT");
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("demo_STUDENT");
    expect(session?.name).toBe("Demo STUDENT");
  });

  it("authenticates demo_STUDENT Bearer token in request headers", async () => {
    const mockReq = {
      headers: {
        authorization: "Bearer demo_STUDENT",
      },
    } as unknown as Request;

    const user = await sdk.authenticateRequest(mockReq);
    expect(user).toBeDefined();
    expect(user.openId).toBe("demo_STUDENT");
    expect(user.name).toBe("Rahul Sharma");
    expect(user.email).toBe("student@northstar.edu");
    expect(user.role).toBe("user");
  });

  it("authenticates demo_ADMIN Bearer token as admin role", async () => {
    const mockReq = {
      headers: {
        authorization: "Bearer demo_ADMIN",
      },
    } as unknown as Request;

    const user = await sdk.authenticateRequest(mockReq);
    expect(user).toBeDefined();
    expect(user.openId).toBe("demo_ADMIN");
    expect(user.role).toBe("admin");
  });

  it("allows auth.me to return the authenticated demo persona", async () => {
    const mockReq = {
      headers: {
        authorization: "Bearer demo_FACULTY",
      },
    } as unknown as Request;

    const user = await sdk.authenticateRequest(mockReq);
    const caller = appRouter.createCaller({
      req: mockReq as any,
      res: {} as any,
      user,
    });

    const me = await caller.auth.me();
    expect(me).toBeDefined();
    expect(me?.name).toBe("Dr. Anand Verma");
    expect(me?.openId).toBe("demo_FACULTY");
  });
});
