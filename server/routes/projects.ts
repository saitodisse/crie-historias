import { Router } from "express";
import { storage } from "../storage";
import { insertProjectSchema } from "@shared/schema";
import { isAuthenticated } from "../auth";
import { getAppUser, toInt } from "./utils";

const router = Router();

router.get("/projects", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = await storage.getProjects(user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/projects/:id", isAuthenticated, async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const storyChars = await storage.getProjectCharacters(id);
    const storyScripts = await storage.getScriptsByProject(id);
    res.json({ ...project, characters: storyChars, scripts: storyScripts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/projects", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const parsed = insertProjectSchema
      .partial()
      .extend({ title: insertProjectSchema.shape.title })
      .parse({ ...req.body, userId: user.id });
    const project = await storage.createProject(parsed as any);
    res.status(201).json(project);
  } catch (error: any) {
    if (error.name === "ZodError")
      return res
        .status(400)
        .json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.patch("/projects/:id", isAuthenticated, async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const project = await storage.updateProject(id, req.body);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/projects/:id", isAuthenticated, async (req, res) => {
  try {
    await storage.deleteProject(toInt(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/projects/:id/characters", isAuthenticated, async (req, res) => {
  try {
    const projectId = toInt(req.params.id);
    const { characterId } = req.body;
    const link = await storage.addProjectCharacter({
      projectId,
      characterId,
    });
    res.status(201).json(link);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/projects/:projectId/characters/:characterId",
  isAuthenticated,
  async (req, res) => {
    try {
      await storage.removeProjectCharacter(
        toInt(req.params.projectId),
        toInt(req.params.characterId)
      );
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
