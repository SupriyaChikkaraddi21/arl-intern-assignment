import { pool } from "../db";
import { Harvest } from "../types";

export const createHarvest = async (
  batch_id: number,
  harvested_on: string,
  weight_grams: number,
  grade: string
): Promise<Harvest> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const batchResult = await client.query(
      `
      SELECT
        id,
        stage
      FROM batches
      WHERE id = $1
      FOR UPDATE
      `,
      [batch_id]
    );

    const batch = batchResult.rows[0];

    if (!batch) {
      throw new Error("BATCH_NOT_FOUND");
    }

    if (batch.stage !== "HARVEST_READY") {
      throw new Error("BATCH_NOT_READY_FOR_HARVEST");
    }

    const harvestResult = await client.query(
      `
      INSERT INTO harvests (
        batch_id,
        harvested_on,
        weight_grams,
        grade
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        batch_id,
        harvested_on,
        weight_grams,
        grade
      `,
      [
        batch_id,
        harvested_on,
        weight_grams,
        grade,
      ]
    );

    await client.query(
      `
      UPDATE batches
      SET stage = 'HARVESTED'
      WHERE id = $1
      `,
      [batch_id]
    );

    await client.query("COMMIT");

    return harvestResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
export const getYieldReport = async (
  from: string,
  to: string,
  groupBy: "crop" | "zone"
) => {
  const groupColumn =
    groupBy === "crop" ? "b.crop" : "t.zone";

  const result = await pool.query(
    `
    SELECT
      ${groupColumn} AS "group",
      SUM(h.weight_grams)::int AS total_harvested_weight_grams,
      COUNT(DISTINCT b.id)::int AS batches_harvested,
      ROUND(
        AVG(h.harvested_on - b.seeded_on),
        2
      ) AS average_days_to_harvest
    FROM harvests h
    JOIN batches b
      ON b.id = h.batch_id
    JOIN trays t
      ON t.id = b.tray_id
    WHERE h.harvested_on BETWEEN $1 AND $2
    GROUP BY ${groupColumn}
    ORDER BY ${groupColumn}
    `,
    [from, to]
  );

  return result.rows;
};