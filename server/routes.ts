import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import {
  insertStorySchema, insertCharacterSchema, insertScriptSchema,
  insertPromptSchema, insertCreativeProfileSchema,
} from "@shared/schema";

const DEFAULT_USER_ID = 1;

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function ensureDefaultUser() {
  let user = await storage.getUser(DEFAULT_USER_ID);
  if (!user) {
    user = await storage.createUser({ username: "creator", password: "local" });
  }
  return user;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/stories", async (req, res) => {
    try {
      await ensureDefaultUser();
      const result = await storage.getStories(DEFAULT_USER_ID);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const story = await storage.getStory(id);
      if (!story) return res.status(404).json({ error: "Story not found" });
      const storyChars = await storage.getStoryCharacters(id);
      const storyScripts = await storage.getScriptsByStory(id);
      res.json({ ...story, characters: storyChars, scripts: storyScripts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      await ensureDefaultUser();
      const parsed = insertStorySchema.partial().extend({ title: insertStorySchema.shape.title }).parse({ ...req.body, userId: DEFAULT_USER_ID });
      const story = await storage.createStory(parsed as any);
      res.status(201).json(story);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ error: "Invalid data", details: error.errors });
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const story = await storage.updateStory(id, req.body);
      if (!story) return res.status(404).json({ error: "Story not found" });
      res.json(story);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      await storage.deleteStory(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stories/:id/characters", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      const { characterId } = req.body;
      const link = await storage.addStoryCharacter({ storyId, characterId });
      res.status(201).json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stories/:storyId/characters/:characterId", async (req, res) => {
    try {
      await storage.removeStoryCharacter(parseInt(req.params.storyId), parseInt(req.params.characterId));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/characters", async (req, res) => {
    try {
      await ensureDefaultUser();
      const result = await storage.getCharacters(DEFAULT_USER_ID);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/characters/:id", async (req, res) => {
    try {
      const char = await storage.getCharacter(parseInt(req.params.id));
      if (!char) return res.status(404).json({ error: "Character not found" });
      res.json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      await ensureDefaultUser();
      const char = await storage.createCharacter({ ...req.body, userId: DEFAULT_USER_ID });
      res.status(201).json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const char = await storage.updateCharacter(parseInt(req.params.id), req.body);
      if (!char) return res.status(404).json({ error: "Character not found" });
      res.json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      await storage.deleteCharacter(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scripts", async (req, res) => {
    try {
      const allScripts = await storage.getScripts();
      const enriched = await Promise.all(
        allScripts.map(async (s) => {
          const story = await storage.getStory(s.storyId);
          return { ...s, storyTitle: story?.title };
        })
      );
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scripts/:id", async (req, res) => {
    try {
      const script = await storage.getScript(parseInt(req.params.id));
      if (!script) return res.status(404).json({ error: "Script not found" });
      const story = await storage.getStory(script.storyId);
      res.json({ ...script, storyTitle: story?.title });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scripts", async (req, res) => {
    try {
      const script = await storage.createScript(req.body);
      res.status(201).json(script);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/scripts/:id", async (req, res) => {
    try {
      const script = await storage.updateScript(parseInt(req.params.id), req.body);
      if (!script) return res.status(404).json({ error: "Script not found" });
      res.json(script);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scripts/:id", async (req, res) => {
    try {
      await storage.deleteScript(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/prompts", async (req, res) => {
    try {
      await ensureDefaultUser();
      const result = await storage.getPrompts(DEFAULT_USER_ID);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      await ensureDefaultUser();
      const prompt = await storage.createPrompt({ ...req.body, userId: DEFAULT_USER_ID });
      res.status(201).json(prompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    try {
      const existing = await storage.getPrompt(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ error: "Prompt not found" });
      const updatedData = { ...req.body };
      if (req.body.content && req.body.content !== existing.content) {
        updatedData.version = existing.version + 1;
      }
      const prompt = await storage.updatePrompt(parseInt(req.params.id), updatedData);
      res.json(prompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    try {
      await storage.deletePrompt(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      await ensureDefaultUser();
      const result = await storage.getProfiles(DEFAULT_USER_ID);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      await ensureDefaultUser();
      const profile = await storage.createProfile({ ...req.body, userId: DEFAULT_USER_ID });
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(parseInt(req.params.id), req.body);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      await storage.deleteProfile(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles/:id/activate", async (req, res) => {
    try {
      await storage.setActiveProfile(DEFAULT_USER_ID, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions", async (req, res) => {
    try {
      await ensureDefaultUser();
      const execs = await storage.getExecutions(DEFAULT_USER_ID);
      const enriched = await Promise.all(
        execs.map(async (e) => {
          const [story, character, script, prompt] = await Promise.all([
            e.storyId ? storage.getStory(e.storyId) : undefined,
            e.characterId ? storage.getCharacter(e.characterId) : undefined,
            e.scriptId ? storage.getScript(e.scriptId) : undefined,
            e.promptId ? storage.getPrompt(e.promptId) : undefined,
          ]);
          return {
            ...e,
            storyTitle: story?.title,
            characterName: character?.name,
            scriptTitle: script?.title,
            promptName: prompt?.name,
          };
        })
      );
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      await ensureDefaultUser();
      const { storyId, characterId, scriptId, promptId, userPrompt, type } = req.body;

      const profile = await storage.getActiveProfile(DEFAULT_USER_ID);
      const model = profile?.model || "gpt-5-mini";
      const maxTokens = profile?.maxTokens || 2048;

      let contextParts: string[] = [];
      let systemPrompt = "You are a skilled creative writing assistant. ";

      if (profile?.narrativeStyle) {
        systemPrompt += `Write in this style: ${profile.narrativeStyle}. `;
      }

      let story, character, script, promptRecord;

      if (storyId) {
        story = await storage.getStory(storyId);
        if (story) {
          contextParts.push(`Story: "${story.title}"`);
          if (story.premise) contextParts.push(`Premise: ${story.premise}`);
          if (story.tone) contextParts.push(`Tone/Genre: ${story.tone}`);
          const chars = await storage.getStoryCharacters(storyId);
          if (chars.length > 0) {
            contextParts.push(`Characters: ${chars.map((c) => `${c.name} - ${c.personality || c.description || ""}`).join("; ")}`);
          }
        }
      }

      if (characterId) {
        character = await storage.getCharacter(characterId);
        if (character) {
          contextParts.push(`Character: ${character.name}`);
          if (character.description) contextParts.push(`Description: ${character.description}`);
          if (character.personality) contextParts.push(`Personality: ${character.personality}`);
          if (character.background) contextParts.push(`Background: ${character.background}`);
        }
      }

      if (scriptId) {
        script = await storage.getScript(scriptId);
        if (script) {
          contextParts.push(`Script: "${script.title}" (${script.type})`);
          if (script.content) contextParts.push(`Current content:\n${script.content.substring(0, 2000)}`);
        }
      }

      if (promptId) {
        promptRecord = await storage.getPrompt(promptId);
        if (promptRecord) {
          systemPrompt += promptRecord.content + " ";
        }
      }

      const finalPrompt = contextParts.length > 0
        ? `Context:\n${contextParts.join("\n")}\n\nRequest: ${userPrompt}`
        : userPrompt;

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalPrompt },
        ],
        max_completion_tokens: maxTokens,
      });

      const result = completion.choices[0]?.message?.content || "";

      const execution = await storage.createExecution({
        userId: DEFAULT_USER_ID,
        promptId: promptId || null,
        storyId: storyId || null,
        scriptId: scriptId || null,
        characterId: characterId || null,
        systemPromptSnapshot: systemPrompt,
        userPrompt,
        finalPrompt,
        model,
        parameters: { maxTokens },
        result,
      });

      res.json({ execution, result });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/rerun", async (req, res) => {
    try {
      const { executionId } = req.body;
      const original = await storage.getExecution(executionId);
      if (!original) return res.status(404).json({ error: "Execution not found" });

      const params = (original.parameters || {}) as Record<string, any>;
      const maxTokens = params.maxTokens || 2048;

      const completion = await openai.chat.completions.create({
        model: original.model,
        messages: [
          { role: "system", content: original.systemPromptSnapshot || "" },
          { role: "user", content: original.finalPrompt },
        ],
        max_completion_tokens: maxTokens,
      });

      const result = completion.choices[0]?.message?.content || "";

      const execution = await storage.createExecution({
        userId: original.userId,
        promptId: original.promptId,
        storyId: original.storyId,
        scriptId: original.scriptId,
        characterId: original.characterId,
        systemPromptSnapshot: original.systemPromptSnapshot,
        userPrompt: original.userPrompt,
        finalPrompt: original.finalPrompt,
        model: original.model,
        parameters: original.parameters,
        result,
      });

      res.json({ execution, result });
    } catch (error: any) {
      console.error("AI re-run error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
