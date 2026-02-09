import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { toInt } from "./utils";

const router = Router();

router.get("/scripts", isAuthenticated, async (req, res) => {
  try {
    const allScripts = await storage.getScripts();
    const enriched = await Promise.all(
      allScripts.map(async (s) => {
        const project = await storage.getProject(s.projectId);
        return { ...s, projectTitle: project?.title };
      })
    );
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/scripts/:id", isAuthenticated, async (req, res) => {
  try {
    const script = await storage.getScript(toInt(req.params.id));
    if (!script) return res.status(404).json({ error: "Script not found" });
    const [project, promptIds] = await Promise.all([
      storage.getProject(script.projectId),
      storage.getScriptPrompts(script.id),
    ]);
    res.json({ ...script, projectTitle: project?.title, promptIds });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/scripts", isAuthenticated, async (req, res) => {
  try {
    const { promptIds, ...scriptData } = req.body;
    const script = await storage.createScript(scriptData);
    if (promptIds && Array.isArray(promptIds)) {
      await storage.updateScriptPrompts(script.id, promptIds);
    }
    res.status(201).json(script);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/scripts/:id", isAuthenticated, async (req, res) => {
  try {
    const scriptId = toInt(req.params.id);
    const { promptIds, ...scriptData } = req.body;
    const script = await storage.updateScript(scriptId, scriptData);
    if (!script) return res.status(404).json({ error: "Script not found" });

    if (promptIds && Array.isArray(promptIds)) {
      await storage.updateScriptPrompts(scriptId, promptIds);
    }
    res.json(script);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/scripts/:id", isAuthenticated, async (req, res) => {
  try {
    await storage.deleteScript(toInt(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
