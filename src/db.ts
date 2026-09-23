import "dotenv/config";
import { Pool, types } from "pg";

// PostgreSQL DATE (OID 1082) should remain a YYYY-MM-DD string.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});