import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser, toInt } from "./utils";

const router = Router();

router.get("/profiles", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = await storage.getProfiles(user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/profiles", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await storage.createProfile({
      ...req.body,
      userId: user.id,
    });
    res.status(201).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/profiles/:id", isAuthenticated, async (req, res) => {
  try {
    const profile = await storage.updateProfile(toInt(req.params.id), req.body);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/profiles/:id", isAuthenticated, async (req, res) => {
  try {
    await storage.deleteProfile(toInt(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/profiles/:id/activate", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    await storage.setActiveProfile(user.id, toInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
