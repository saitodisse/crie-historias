import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser, toInt } from "./utils";

const router = Router();

router.get("/prompts", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = await storage.getPrompts(user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/prompts/:id", isAuthenticated, async (req, res) => {
  try {
    const prompt = await storage.getPrompt(toInt(req.params.id));
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/prompts", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const prompt = await storage.createPrompt({
      ...req.body,
      userId: user.id,
    });
    res.status(201).json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/prompts/:id", isAuthenticated, async (req, res) => {
  try {
    const existing = await storage.getPrompt(toInt(req.params.id));
    if (!existing) return res.status(404).json({ error: "Prompt not found" });
    const updatedData = { ...req.body };
    if (req.body.content && req.body.content !== existing.content) {
      updatedData.version = existing.version + 1;
    }
    const prompt = await storage.updatePrompt(
      toInt(req.params.id),
      updatedData
    );
    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/prompts/:id", isAuthenticated, async (req, res) => {
  try {
    await storage.deletePrompt(toInt(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
