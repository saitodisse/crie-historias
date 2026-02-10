import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser } from "./utils";
import { seedDatabase } from "../seed";
import { importDataForUser } from "../services/import-service";

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
    if (!data || (!data.version && !data.data)) {
      return res.status(400).json({ error: "Invalid backup file format" });
    }

    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Handle both wrapped format { version, data: {...} } and direct format {...}
    const importContent = data.data || data;

    await importDataForUser(user.id, importContent);
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

    // seedDatabase now uses the good-configuration.json and clears existing data via importDataForUser
    await seedDatabase(user.id);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Factory reset error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
