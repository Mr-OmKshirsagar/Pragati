import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("student.progress", () => {
  it("returns time-series academic and intervention data", async () => {
    const ctx: TrpcContext = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const result = await appRouter.createCaller(ctx).student.progress();
    expect(result.academic).toHaveLength(6);
    expect(result.academic.at(-1)?.cgpa).toBe(8.42);
    expect(result.skills.some(item => item.label === "Operating Systems")).toBe(true);
    expect(result.interventions.some(item => item.state === "open")).toBe(true);
  });
});
