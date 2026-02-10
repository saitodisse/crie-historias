import { storage } from "./storage";
import { importDataForUser } from "./services/import-service";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_USER_ID = 1;

async function ensureSeedUser(preferredUserId?: number) {
  if (preferredUserId) {
    const userById = await storage.getUser(preferredUserId);
    if (userById) return userById;
  }

  const externalAuthId = process.env.DEV_AUTH_USER_ID || "local-dev-user";
  return storage.getOrCreateUserByExternalAuthId(
    externalAuthId,
    "local",
    "Dev User"
  );
}

export async function seedDatabase(userId: number = DEFAULT_USER_ID) {
  const seedUser = await ensureSeedUser(userId);
  const effectiveUserId = seedUser.id;

  // Path to the good configuration JSON
  // Assuming this runs from project root or server dir, we try to locate 'data' folder
  const configPath = path.resolve(__dirname, "../data/good-configurtion.json");

  try {
    const fileContent = await fs.readFile(configPath, "utf-8");
    const jsonConfig = JSON.parse(fileContent);

    if (!jsonConfig.data) {
      throw new Error("Invalid configuration file: missing 'data' property");
    }

    console.log(
      `Seeding database for user ${effectiveUserId} from ${configPath}...`
    );

    // Use the smart import service to clear and import data
    await importDataForUser(effectiveUserId, jsonConfig.data);

    console.log("Seed data imported successfully.");
  } catch (error) {
    console.error("Failed to seed database:", error);
    throw error;
  }
}
