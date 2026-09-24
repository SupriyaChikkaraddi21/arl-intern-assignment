import { pool } from "../db";
import { Batch } from "../types";

const stageOrder = [
  "SEEDED",
  "GERMINATION",
  "GROWING",
  "HARVEST_READY",
  "HARVESTED",
];

export const updateBatchStage = async (
  id: number,
  newStage: string
): Promise<Batch | null> => {
  const result = await pool.query(
    `
    SELECT
      id,
      tray_id,
      crop,
      seeded_on,
      stage,
      expected_harvest_on
    FROM batches
    WHERE id = $1
    `,
    [id]
  );

  const batch = result.rows[0];

  if (!batch) {
    return null;
  }

  const currentIndex = stageOrder.indexOf(batch.stage);
  const newIndex = stageOrder.indexOf(newStage);

  // Only allow exactly one step forward.
  if (newIndex !== currentIndex + 1) {
    throw new Error("INVALID_STAGE_TRANSITION");
  }

  const updateResult = await pool.query(
    `
    UPDATE batches
    SET stage = $1
    WHERE id = $2
    RETURNING
      id,
      tray_id,
      crop,
      seeded_on,
      stage,
      expected_harvest_on
    `,
    [newStage, id]
  );

  return updateResult.rows[0];
};