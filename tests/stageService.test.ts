import { describe, expect, it } from "vitest";

const stageOrder = [
  "SEEDED",
  "GERMINATION",
  "GROWING",
  "HARVEST_READY",
  "HARVESTED",
];

function isValidStageTransition(
  currentStage: string,
  newStage: string
): boolean {
  const currentIndex = stageOrder.indexOf(currentStage);
  const newIndex = stageOrder.indexOf(newStage);

  return newIndex === currentIndex + 1;
}

describe("Batch stage transitions", () => {
  it("allows SEEDED -> GERMINATION", () => {
    expect(
      isValidStageTransition("SEEDED", "GERMINATION")
    ).toBe(true);
  });

  it("allows GERMINATION -> GROWING", () => {
    expect(
      isValidStageTransition("GERMINATION", "GROWING")
    ).toBe(true);
  });

  it("allows GROWING -> HARVEST_READY", () => {
    expect(
      isValidStageTransition("GROWING", "HARVEST_READY")
    ).toBe(true);
  });

  it("allows HARVEST_READY -> HARVESTED", () => {
    expect(
      isValidStageTransition("HARVEST_READY", "HARVESTED")
    ).toBe(true);
  });

  it("rejects SEEDED -> GROWING", () => {
    expect(
      isValidStageTransition("SEEDED", "GROWING")
    ).toBe(false);
  });

  it("rejects GROWING -> SEEDED", () => {
    expect(
      isValidStageTransition("GROWING", "SEEDED")
    ).toBe(false);
  });

  it("rejects HARVEST_READY -> GROWING", () => {
    expect(
      isValidStageTransition("HARVEST_READY", "GROWING")
    ).toBe(false);
  });
});