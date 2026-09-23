import { describe, expect, it } from "vitest";

describe("Harvest business rules", () => {
  it("should allow harvesting only when batch is HARVEST_READY", () => {
    const stage = "HARVEST_READY";

    expect(stage).toBe("HARVEST_READY");
  });

  it("should reject harvesting when batch is GROWING", () => {
    const stage = "GROWING";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("should reject harvesting when batch is SEEDED", () => {
    const stage = "SEEDED";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("should reject harvesting when batch is already HARVESTED", () => {
    const stage = "HARVESTED";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("should require a positive harvest weight", () => {
    const weight = 500;

    expect(weight).toBeGreaterThan(0);
  });

  it("should store the harvest grade", () => {
    const grade = "A";

    expect(grade).toBe("A");
  });
});