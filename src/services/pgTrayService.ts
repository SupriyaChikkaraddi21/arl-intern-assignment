import { pool } from "../db";
import { Tray } from "../types";

export const createTray = async (
  code: string,
  zone: string,
  capacity_units: number
): Promise<Tray> => {
  const result = await pool.query(
    `
    INSERT INTO trays (code, zone, capacity_units)
    VALUES ($1, $2, $3)
    RETURNING id, code, zone, capacity_units, created_at
    `,
    [code, zone, capacity_units]
  );

  return result.rows[0];
};

export const getAllTrays = async (): Promise<Tray[]> => {
  const result = await pool.query(
    `
    SELECT id, code, zone, capacity_units, created_at
    FROM trays
    ORDER BY id
    `
  );

  return result.rows;
};

export const getTrayById = async (
  id: number
): Promise<Tray | undefined> => {
  const result = await pool.query(
    `
    SELECT id, code, zone, capacity_units, created_at
    FROM trays
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};