import pg from "pg";
import { execSync } from "child_process";
const { Client } = pg;

export async function ensureDatabaseExists() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  const url = new URL(dbUrl);
  const dbName = url.pathname.slice(1);
  
  if (!dbName || dbName === "postgres") return;

  // Create a connection string to the default 'postgres' database
  const baseUrl = new URL(dbUrl);
  baseUrl.pathname = "/postgres";
  
  const client = new Client({
    connectionString: baseUrl.toString(),
    // Use the same SSL config as in db.ts if needed
    ssl: (process.env.PGSSLMODE === "require" || dbUrl.includes("neon.tech")) 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  let dbCreated = false;
  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`[DB] Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB] Database "${dbName}" created successfully.`);
      dbCreated = true;
    }
  } catch (error) {
    console.error("[DB] Error ensuring database exists:", (error as Error).message);
  } finally {
    await client.end();
  }

  // If the database was just created, or if we want to ensure schema is up to date
  // we run drizzle-kit push
  if (dbCreated || process.env.NODE_ENV !== "production") {
    try {
      console.log("[DB] Pushing schema to database...");
      // We use npx drizzle-kit push to ensure schema matches the code
      execSync("npx drizzle-kit push", { stdio: "inherit" });
      console.log("[DB] Schema pushed successfully.");
    } catch (error) {
      console.error("[DB] Error pushing schema:", (error as Error).message);
    }
  }
}
