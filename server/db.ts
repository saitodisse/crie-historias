import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log connection attempt (masking password)
const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":*****@");
console.log(`[DB] Attempting to connect to: ${maskedUrl}`);

const useSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.DATABASE_URL.includes("neon.tech");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
