import { pool } from "../db";
import { Batch } from "../types";

export const createBatch = async (
  tray_id: number,
  crop: string,
  seeded_on: string,
  stage: string,
  expected_harvest_on: string
): Promise<Batch> => {
  const result = await pool.query(
    `
    INSERT INTO batches (
      tray_id,
      crop,
      seeded_on,
      stage,
      expected_harvest_on
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      tray_id,
      crop,
      seeded_on,
      stage,
      expected_harvest_on
    `,
    [
      tray_id,
      crop,
      seeded_on,
      stage,
      expected_harvest_on,
    ]
  );

  return result.rows[0];
};

export interface BatchFilters {
  stage?: string;
  crop?: string;
  zone?: string;
  page?: number;
  limit?: number;
}

export const getAllBatches = async (
  filters: BatchFilters = {}
): Promise<{ value: Batch[]; Count: number }> => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.stage) {
    values.push(filters.stage);
    conditions.push(`b.stage = $${values.length}`);
  }

  if (filters.crop) {
    values.push(filters.crop);
    conditions.push(`b.crop = $${values.length}`);
  }

  if (filters.zone) {
    values.push(filters.zone);
    conditions.push(`t.zone = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM batches b
    JOIN trays t ON t.id = b.tray_id
    ${whereClause}
    `,
    values
  );

  const Count = countResult.rows[0].count;

  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(
    Math.max(filters.limit ?? 20, 1),
    100
  );

  const offset = (page - 1) * limit;

  const dataValues = [...values, limit, offset];

  const result = await pool.query(
    `
    SELECT
      b.id,
      b.tray_id,
      b.crop,
      b.seeded_on,
      b.stage,
      b.expected_harvest_on
    FROM batches b
    JOIN trays t ON t.id = b.tray_id
    ${whereClause}
    ORDER BY b.id
    LIMIT $${dataValues.length - 1}
    OFFSET $${dataValues.length}
    `,
    dataValues
  );

  return {
    value: result.rows,
    Count,
  };
};

export const getBatchById = async (
  id: number
): Promise<Batch | undefined> => {
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

  return result.rows[0];
};