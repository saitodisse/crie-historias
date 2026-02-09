import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser, toInt } from "./utils";

const router = Router();

router.get("/characters", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = await storage.getCharacters(user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/characters/:id", isAuthenticated, async (req, res) => {
  try {
    const char = await storage.getCharacter(toInt(req.params.id));
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(char);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/characters", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const char = await storage.createCharacter({
      ...req.body,
      userId: user.id,
    });
    res.status(201).json(char);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/characters/:id", isAuthenticated, async (req, res) => {
  try {
    const char = await storage.updateCharacter(toInt(req.params.id), req.body);
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(char);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/characters/:id", isAuthenticated, async (req, res) => {
  try {
    await storage.deleteCharacter(toInt(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
