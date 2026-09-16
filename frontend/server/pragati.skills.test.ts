import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("student.skills", () => {
  it("returns assessment histories with verification and intervention context", async () => {
    const ctx: TrpcContext = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const result = await appRouter.createCaller(ctx).student.skills();
    const dsa = result.skills.find(item => item.label === "DSA");
    expect(result.skills).toHaveLength(8);
    expect(dsa?.history.map(item => item.score)).toEqual([61, 70, 78]);
    expect(dsa?.history.at(-1)?.verification).toBe("Institution Verified");
    expect(dsa?.improvement?.note).toContain("not causal proof");
  });
});
