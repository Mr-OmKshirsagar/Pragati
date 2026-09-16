import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("student.dashboard", () => {
  it("returns the API-shaped readiness dashboard contract", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const dashboard = await appRouter.createCaller(ctx).student.dashboard();

    expect(dashboard.student).toMatchObject({
      name: expect.any(String),
      program: expect.any(String),
      avatarInitials: expect.any(String),
    });
    expect(dashboard.readiness.score).toBeGreaterThanOrEqual(0);
    expect(dashboard.readiness.score).toBeLessThanOrEqual(100);
    expect(dashboard.readiness.formula).toContain("30%");
    expect(dashboard.readiness.indicators).toHaveLength(4);
    expect(dashboard.readiness.indicators.reduce((total, indicator) => total + indicator.weight, 0)).toBe(100);
    expect(dashboard.metrics).toHaveLength(4);
    expect(dashboard.skillProfile.length).toBeGreaterThan(4);
    expect(dashboard.timeline.length).toBeGreaterThan(3);
    expect(dashboard.skillGap.source).toBe("rule");
  });
});
