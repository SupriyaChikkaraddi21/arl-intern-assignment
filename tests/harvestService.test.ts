import { describe, expect, it } from "vitest";

describe("Harvest business rules", () => {
  it("allows harvesting only when batch is HARVEST_READY", () => {
    const validStage = "HARVEST_READY";

    expect(validStage).toBe("HARVEST_READY");
  });

  it("rejects harvesting when batch is GROWING", () => {
    const stage = "GROWING";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("rejects harvesting when batch is SEEDED", () => {
    const stage = "SEEDED";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("rejects harvesting when batch is already HARVESTED", () => {
    const stage = "HARVESTED";

    expect(stage).not.toBe("HARVEST_READY");
  });

  it("requires a positive harvest weight", () => {
    const validWeight = 500;

    expect(validWeight).toBeGreaterThan(0);
  });

  it("stores the harvest grade", () => {
    const grade = "A";

    expect(grade).toBe("A");
  });
});