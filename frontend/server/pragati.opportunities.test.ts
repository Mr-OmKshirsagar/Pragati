import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("student.opportunities", () => {
  it("returns distinct opportunities with transparent criteria", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const result = await appRouter.createCaller(ctx).student.opportunities();

    expect(result.opportunities).toHaveLength(4);
    expect(result.summary.eligible).toBe(3);
    expect(result.opportunities.every(item => item.criteria.length > 0)).toBe(true);
    expect(result.opportunities.some(item => item.criteria.some(criteria => !criteria.pass))).toBe(true);
    expect(result.opportunities.map(item => item.applicationStatus)).toContain("Applied");
    expect(result.opportunities.map(item => item.applicationStatus)).toContain("In review");
  });
});
