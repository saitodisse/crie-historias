import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { encrypt, decrypt } from "./crypto";
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

  app.get("/api/user/keys", async (req, res) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
      res.json({
        hasOpenai: !!user.openaiKey,
        hasGemini: !!user.geminiKey,
        hasOpenrouter: !!user.openrouterKey,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/keys", async (req, res) => {
    try {
      const { openaiKey, geminiKey, openrouterKey } = req.body;
      const updates: any = {};
      if (openaiKey !== undefined) updates.openaiKey = openaiKey ? encrypt(openaiKey) : null;
      if (geminiKey !== undefined) updates.geminiKey = geminiKey ? encrypt(geminiKey) : null;
      if (openrouterKey !== undefined) updates.openrouterKey = openrouterKey ? encrypt(openrouterKey) : null;

      await storage.updateUser(DEFAULT_USER_ID, updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/models/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      const user = await storage.getUser(DEFAULT_USER_ID);

      if (provider === "openai") {
        const apiKey = user?.openaiKey ? decrypt(user.openaiKey) : process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
        const baseURL = user?.openaiKey ? "https://api.openai.com/v1" : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
        const client = new OpenAI({ apiKey, baseURL });
        const list = await client.models.list();
        const models = [];
        for await (const m of list) {
          if (m.id.startsWith("gpt-") || m.id.startsWith("o") || m.id.includes("chatgpt")) {
            models.push({ id: m.id, name: m.id });
          }
        }
        models.sort((a, b) => a.name.localeCompare(b.name));
        res.json(models);
      } else if (provider === "gemini") {
        const apiKey = user?.geminiKey ? decrypt(user.geminiKey) : null;
        if (!apiKey) {
          return res.json([
            { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
            { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
            { id: "gemini-pro", name: "Gemini Pro" },
          ]);
        }
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!resp.ok) throw new Error("Falha ao buscar modelos do Gemini");
        const data = await resp.json();
        const models = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => ({
            id: m.name.replace("models/", ""),
            name: m.displayName || m.name.replace("models/", ""),
          }));
        res.json(models);
      } else if (provider === "openrouter") {
        const resp = await fetch("https://openrouter.ai/api/v1/models");
        if (!resp.ok) throw new Error("Falha ao buscar modelos do OpenRouter");
        const data = await resp.json();
        const models = (data.data || [])
          .map((m: any) => ({
            id: m.id,
            name: `${m.name || m.id} ($${((m.pricing?.completion || 0) * 1000000).toFixed(2)}/M)`,
          }));
        models.sort((a: any, b: any) => a.name.localeCompare(b.name));
        res.json(models.slice(0, 100));
      } else {
        res.status(400).json({ error: "Provedor inválido" });
      }
    } catch (error: any) {
      console.error("Error fetching models:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      await ensureDefaultUser();
      const user = await storage.getUser(DEFAULT_USER_ID);
      const { storyId, characterId, scriptId, promptId, userPrompt, type } = req.body;

      const profile = await storage.getActiveProfile(DEFAULT_USER_ID);
      const model = profile?.model || "gpt-5-mini";
      const maxTokens = profile?.maxTokens || 2048;

      let contextParts: string[] = [];
      let systemPrompt = "Você é um assistente de escrita criativa habilidoso. ";

      if (profile?.narrativeStyle) {
        systemPrompt += `Escreva neste estilo: ${profile.narrativeStyle}. `;
      }

      let story, character, script, promptRecord;

      if (storyId) {
        story = await storage.getStory(storyId);
        if (story) {
          contextParts.push(`História: "${story.title}"`);
          if (story.premise) contextParts.push(`Premissa: ${story.premise}`);
          if (story.tone) contextParts.push(`Tom/Gênero: ${story.tone}`);
          const chars = await storage.getStoryCharacters(storyId);
          if (chars.length > 0) {
            contextParts.push(`Personagens: ${chars.map((c) => `${c.name} - ${c.personality || c.description || ""}`).join("; ")}`);
          }
        }
      }

      if (characterId) {
        character = await storage.getCharacter(characterId);
        if (character) {
          contextParts.push(`Personagem: ${character.name}`);
          if (character.description) contextParts.push(`Descrição: ${character.description}`);
          if (character.personality) contextParts.push(`Personalidade: ${character.personality}`);
          if (character.background) contextParts.push(`Histórico: ${character.background}`);
        }
      }

      if (scriptId) {
        script = await storage.getScript(scriptId);
        if (script) {
          contextParts.push(`Roteiro: "${script.title}" (${script.type})`);
          if (script.content) contextParts.push(`Conteúdo atual:\n${script.content.substring(0, 2000)}`);
        }
      }

      if (promptId) {
        promptRecord = await storage.getPrompt(promptId);
        if (promptRecord) {
          systemPrompt += promptRecord.content + " ";
        }
      }

      const finalPrompt = contextParts.length > 0
        ? `Contexto:\n${contextParts.join("\n")}\n\nSolicitação: ${userPrompt}`
        : userPrompt;

      let result = "";
      const isGemini = model.startsWith("gemini");
      const isOpenRouter = model.includes("/");
      
      if (isGemini) {
        if (!user?.geminiKey) throw new Error("Chave de API do Gemini não configurada. Configure nas preferências do perfil.");
        const genAI = new GoogleGenerativeAI(decrypt(user.geminiKey));
        const geminiModel = genAI.getGenerativeModel({ model });
        const geminiResult = await geminiModel.generateContent({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${finalPrompt}` }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        });
        result = geminiResult.response.text();
      } else if (isOpenRouter) {
        const apiKey = user?.openrouterKey ? decrypt(user.openrouterKey) : null;
        if (!apiKey) throw new Error("Chave de API do OpenRouter não configurada");
        const aiClient = new OpenAI({
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        });
        const completion = await aiClient.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: finalPrompt },
          ],
          max_completion_tokens: maxTokens,
        });
        result = completion.choices[0]?.message?.content || "";
      } else {
        const apiKey = user?.openaiKey ? decrypt(user.openaiKey) : process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
        const baseURL = user?.openaiKey ? "https://api.openai.com/v1" : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
        const aiClient = new OpenAI({ apiKey, baseURL });
        const completion = await aiClient.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: finalPrompt },
          ],
          max_completion_tokens: maxTokens,
        });
        result = completion.choices[0]?.message?.content || "";
      }

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

  app.post("/api/admin/reset", async (req, res) => {
    try {
      await ensureDefaultUser();
      const { db } = await import("./db");
      const { aiExecutions, scripts, storyCharacters, prompts, creativeProfiles, stories, characters } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { seedDatabase } = await import("./seed");

      // Limpeza manual para garantir que CASCADE funcione ou limpar em ordem
      await db.delete(aiExecutions);
      await db.delete(scripts);
      await db.delete(storyCharacters);
      await db.delete(prompts);
      await db.delete(creativeProfiles);
      await db.delete(stories);
      await db.delete(characters);

      await seedDatabase();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Factory reset error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
