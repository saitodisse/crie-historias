import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser } from "./utils";
import { db } from "../db";
import {
  aiExecutions,
  scripts,
  projectCharacters,
  prompts,
  creativeProfiles,
  projects,
  characters,
} from "@shared/schema";
import { seedDatabase } from "../seed";
import { seedWizardTemplates } from "../seed-wizard";
import { eq, inArray } from "drizzle-orm";

const router = Router();

router.get("/export", isAuthenticated, async (req, res) => {
  try {
    const exportData = await storage.exportData();
    res.header("Content-Type", "application/json");
    res.attachment(
      `storyforge-backup-${new Date().toISOString().split("T")[0]}.json`
    );
    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/import", isAuthenticated, async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.version) {
      return res.status(400).json({ error: "Invalid backup file format" });
    }

    await storage.importData(data);
    res.json({ success: true, message: "Data imported successfully" });
  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import data: " + error.message });
  }
});

router.post("/reset", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Delete user-specific data
    await db.delete(aiExecutions).where(eq(aiExecutions.userId, user.id));

    // Delete scripts linked to user's projects
    const userProjects = db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, user.id));

    await db.delete(scripts).where(inArray(scripts.projectId, userProjects));

    await db
      .delete(projectCharacters)
      .where(inArray(projectCharacters.projectId, userProjects));

    await db.delete(prompts).where(eq(prompts.userId, user.id));
    await db
      .delete(creativeProfiles)
      .where(eq(creativeProfiles.userId, user.id));
    await db.delete(projects).where(eq(projects.userId, user.id));
    await db.delete(characters).where(eq(characters.userId, user.id));

    await seedDatabase(user.id);
    await seedWizardTemplates(user.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Factory reset error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
