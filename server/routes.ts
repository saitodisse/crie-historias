import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { GoogleBillingService } from "./services/googleBilling";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { encrypt, decrypt } from "./crypto";
import { getAuthUser, isAuthenticated } from "./auth";
import {
  insertStorySchema,
  insertCharacterSchema,
  insertScriptSchema,
  insertPromptSchema,
  insertCreativeProfileSchema,
} from "@shared/schema";

// Global OpenAI instance removed to enforce using user-specific keys from DB
// const openai = new OpenAI({ ... });

function toInt(value: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(raw, 10);
}

async function getAppUser(req: any) {
  const authUser = getAuthUser(req);
  const displayName =
    [authUser.firstName, authUser.lastName].filter(Boolean).join(" ") ||
    undefined;

  return storage.getOrCreateUserByExternalAuthId(
    authUser.externalAuthId,
    authUser.provider,
    displayName
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/stories", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const result = await storage.getStories(user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = toInt(req.params.id);
      const story = await storage.getStory(id);
      if (!story) return res.status(404).json({ error: "Story not found" });
      const storyChars = await storage.getStoryCharacters(id);
      const storyScripts = await storage.getScriptsByStory(id);
      res.json({ ...story, characters: storyChars, scripts: storyScripts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stories", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const parsed = insertStorySchema
        .partial()
        .extend({ title: insertStorySchema.shape.title })
        .parse({ ...req.body, userId: user.id });
      const story = await storage.createStory(parsed as any);
      res.status(201).json(story);
    } catch (error: any) {
      if (error.name === "ZodError")
        return res
          .status(400)
          .json({ error: "Invalid data", details: error.errors });
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/stories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = toInt(req.params.id);
      const story = await storage.updateStory(id, req.body);
      if (!story) return res.status(404).json({ error: "Story not found" });
      res.json(story);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stories/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStory(toInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stories/:id/characters", isAuthenticated, async (req, res) => {
    try {
      const storyId = toInt(req.params.id);
      const { characterId } = req.body;
      const link = await storage.addStoryCharacter({ storyId, characterId });
      res.status(201).json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(
    "/api/stories/:storyId/characters/:characterId",
    isAuthenticated,
    async (req, res) => {
      try {
        await storage.removeStoryCharacter(
          toInt(req.params.storyId),
          toInt(req.params.characterId)
        );
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get("/api/characters", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const result = await storage.getCharacters(user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/characters/:id", isAuthenticated, async (req, res) => {
    try {
      const char = await storage.getCharacter(toInt(req.params.id));
      if (!char) return res.status(404).json({ error: "Character not found" });
      res.json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/characters", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const char = await storage.createCharacter({
        ...req.body,
        userId: user.id,
      });
      res.status(201).json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/characters/:id", isAuthenticated, async (req, res) => {
    try {
      const char = await storage.updateCharacter(
        toInt(req.params.id),
        req.body
      );
      if (!char) return res.status(404).json({ error: "Character not found" });
      res.json(char);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/characters/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCharacter(toInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scripts", isAuthenticated, async (req, res) => {
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

  app.get("/api/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      const script = await storage.getScript(toInt(req.params.id));
      if (!script) return res.status(404).json({ error: "Script not found" });
      const story = await storage.getStory(script.storyId);
      res.json({ ...script, storyTitle: story?.title });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scripts", isAuthenticated, async (req, res) => {
    try {
      const script = await storage.createScript(req.body);
      res.status(201).json(script);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      const script = await storage.updateScript(toInt(req.params.id), req.body);
      if (!script) return res.status(404).json({ error: "Script not found" });
      res.json(script);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteScript(toInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/prompts", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const result = await storage.getPrompts(user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/prompts", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const prompt = await storage.createPrompt({
        ...req.body,
        userId: user.id,
      });
      res.status(201).json(prompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/prompts/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/prompts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePrompt(toInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const result = await storage.getProfiles(user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const profile = await storage.createProfile({
        ...req.body,
        userId: user.id,
      });
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.updateProfile(
        toInt(req.params.id),
        req.body
      );
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/profiles/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProfile(toInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles/:id/activate", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      await storage.setActiveProfile(user.id, toInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/keys", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      res.json({
        hasOpenai: !!user.openaiKey,
        hasGemini: !!user.geminiKey,
        hasOpenrouter: !!user.openrouterKey,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/keys", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const { openaiKey, geminiKey, openrouterKey } = req.body;
      const updates: any = {};
      if (openaiKey !== undefined)
        updates.openaiKey = openaiKey ? encrypt(openaiKey) : null;
      if (geminiKey !== undefined)
        updates.geminiKey = geminiKey ? encrypt(geminiKey) : null;
      if (openrouterKey !== undefined)
        updates.openrouterKey = openrouterKey ? encrypt(openrouterKey) : null;

      await storage.updateUser(user.id, updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/models/:provider", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.params;
      const user = await getAppUser(req);

      if (provider === "openai") {
        const apiKey = user?.openaiKey ? decrypt(user.openaiKey) : null;
        const baseURL = user?.openaiKey ? "https://api.openai.com/v1" : null;

        if (!apiKey) {
          return res.status(400).json({
            error:
              "Chave da OpenAI não configurada. Por favor, adicione sua chave nas configurações.",
          });
        }

        const client = new OpenAI({
          apiKey,
          baseURL: baseURL || "https://api.openai.com/v1",
        });
        const list = await client.models.list();
        const models = [];
        const pricing: Record<string, string> = {
          "gpt-4o": "$15.00/M",
          "gpt-4o-mini": "$0.60/M",
          "o1-preview": "$60.00/M",
          "o1-mini": "$12.00/M",
          "gpt-4-turbo": "$30.00/M",
          "gpt-3.5-turbo": "$1.50/M",
        };
        for await (const m of list) {
          if (
            m.id.startsWith("gpt-") ||
            m.id.startsWith("o") ||
            m.id.includes("chatgpt")
          ) {
            const price = pricing[m.id] || "Preço sob consulta";
            models.push({ id: m.id, name: `${m.id} (${price})` });
          }
        }
        models.sort((a, b) => a.name.localeCompare(b.name));
        res.json(models);
      } else if (provider === "gemini") {
        const apiKey = user?.geminiKey ? decrypt(user.geminiKey) : null;
        // Fetch pricing using User Key (if available) or Server Service Account (fallback)
        const dynamicPricing = await GoogleBillingService.getGeminiPricing(
          apiKey || undefined
        );
        const defaultPricing = " (Grátis/Tiered)";

        if (!apiKey) {
          // Even without a User API Key, we can show dynamic pricing if the server has a Service Account
          const fallbackModels = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
          ];
          return res.json(
            fallbackModels.map((id) => {
              // Convert ID to display name (simple logic or use a map if needed)
              const name = id
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return {
                id,
                name: name + (dynamicPricing[id] || defaultPricing),
              };
            })
          );
        }
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!resp.ok) throw new Error("Falha ao buscar modelos do Gemini");
        const data = await resp.json();
        const models = (data.models || [])
          .filter((m: any) =>
            m.supportedGenerationMethods?.includes("generateContent")
          )
          .map((m: any) => {
            const id = m.name.replace("models/", "");
            const pricing = dynamicPricing[id] || defaultPricing;
            return {
              id,
              name: (m.displayName || id) + pricing,
            };
          });
        res.json(models);
      } else if (provider === "openrouter") {
        const resp = await fetch("https://openrouter.ai/api/v1/models");
        if (!resp.ok) throw new Error("Falha ao buscar modelos do OpenRouter");
        const data = await resp.json();
        const models = (data.data || []).map((m: any) => ({
          id: m.id,
          name: `${m.name || m.id} ($${((m.pricing?.completion || 0) * 1000000).toFixed(2)}/M)`,
        }));
        models.sort((a: any, b: any) => a.name.localeCompare(b.name));
        res.json(models);
      } else {
        res.status(400).json({ error: "Provedor inválido" });
      }
    } catch (error: any) {
      console.error("Error fetching models:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      let { storyId, characterId, scriptId, promptId, userPrompt, type } =
        req.body;

      const profile = await storage.getActiveProfile(user.id);
      console.log(
        `[AI Generate] Type: ${type}, User: ${user.id}, Profile: ${profile ? `${profile.name} (ID: ${profile.id}, Model: ${profile.model})` : "Default (No active profile)"}`
      );
      const model = profile?.model || "gpt-4o-mini";
      const maxTokens = profile?.maxTokens || 2048;
      const parsedTemp = profile?.temperature
        ? parseFloat(profile.temperature)
        : NaN;
      const temperature = isNaN(parsedTemp)
        ? 0.8
        : Math.max(0, Math.min(2, parsedTemp));

      let contextParts: string[] = [];
      let systemPrompt = "";

      if (type === "wizard-idea") {
        systemPrompt =
          "Você é um especialista em estruturação de histórias (Story Architect). Sua tarefa é expandir ideias embrionárias em títulos cativantes e premissas sólidas, mantendo um diálogo construtivo com o autor através de perguntas inteligentes. Sempre peça feedback ou faça perguntas ao final.";
      } else if (type === "wizard-script") {
        systemPrompt =
          "Você é um roteirista profissional. Sua tarefa é produzir roteiros completos e detalhados seguindo o formato e estilo solicitados, respeitando fielmente o contexto dos personagens e da história fornecidos.";
      } else if (type === "character-generation") {
        systemPrompt =
          "ATENÇÃO: GERAÇÃO DE DADOS ESTRUTURADOS.\n" +
          "Sua tarefa é gerar um perfil de personagem em JSON válido.\n\n" +
          "SCHEMA ESPERADO (TypeScript):\n" +
          "{\n" +
          "  name: string; // Nome do personagem\n" +
          "  description?: string; // Aparência física\n" +
          "  personality?: string; // Traços de personalidade\n" +
          "  background?: string; // História de fundo\n" +
          "  notes?: string; // Notas adicionais\n" +
          "}\n\n" +
          "Retorne APENAS o JSON. Sem blocos de código markdown. Sem conversa.";
      } else {
        systemPrompt = "Você é um assistente de escrita criativa habilidoso. ";
      }

      if (profile?.narrativeStyle && type !== "character-generation") {
        systemPrompt += ` Escreva neste estilo predominante: ${profile.narrativeStyle}.`;
      }

      // For character generation, append explicit JSON instruction to user prompt as well to override any model tendencies
      if (type === "character-generation") {
        userPrompt = `${userPrompt}\n\nIMPORTANTE: Retorne APENAS um JSON válido.`;
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
            contextParts.push(
              `Personagens: ${chars.map((c) => `${c.name} - ${c.personality || c.description || ""}`).join("; ")}`
            );
          }
        }
      }

      if (characterId) {
        character = await storage.getCharacter(characterId);
        if (character) {
          contextParts.push(`Personagem: ${character.name}`);
          if (character.description)
            contextParts.push(`Descrição: ${character.description}`);
          if (character.personality)
            contextParts.push(`Personalidade: ${character.personality}`);
          if (character.background)
            contextParts.push(`Histórico: ${character.background}`);
        }
      }

      if (scriptId) {
        script = await storage.getScript(scriptId);
        if (script) {
          contextParts.push(`Roteiro: "${script.title}" (${script.type})`);
          if (script.content)
            contextParts.push(
              `Conteúdo atual:\n${script.content.substring(0, 2000)}`
            );
        }
      }

      if (promptId) {
        promptRecord = await storage.getPrompt(promptId);
        if (promptRecord) {
          systemPrompt += promptRecord.content + " ";
        }
      }

      let currentPrompt =
        contextParts.length > 0
          ? `Contexto:\n${contextParts.join("\n")}\n\nSolicitação: ${userPrompt}`
          : userPrompt;

      let result = "";
      const isGemini = model.startsWith("gemini");
      const isOpenRouter = model.includes("/");

      const maxRetries = type === "character-generation" ? 3 : 1;
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;
        try {
          if (isGemini) {
            if (!user?.geminiKey)
              throw new Error(
                "Chave de API do Gemini não configurada. Configure nas preferências do perfil."
              );
            const genAI = new GoogleGenerativeAI(decrypt(user.geminiKey));
            const geminiModel = genAI.getGenerativeModel({ model });
            const geminiResult = await geminiModel.generateContent({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\n${currentPrompt}` }],
                },
              ],
              generationConfig: { maxOutputTokens: maxTokens, temperature },
            });
            result = geminiResult.response.text();
          } else if (isOpenRouter) {
            const apiKey = user?.openrouterKey
              ? decrypt(user.openrouterKey)
              : null;
            if (!apiKey)
              throw new Error("Chave de API do OpenRouter não configurada");
            const aiClient = new OpenAI({
              apiKey,
              baseURL: "https://openrouter.ai/api/v1",
            });
            const completion = await aiClient.chat.completions.create({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: currentPrompt },
              ],
              max_tokens: maxTokens,
              temperature,
              response_format:
                type === "character-generation"
                  ? { type: "json_object" }
                  : undefined,
            });
            result = completion.choices[0]?.message?.content || "";
          } else {
            const apiKey = user?.openaiKey ? decrypt(user.openaiKey) : null;
            const baseURL = user?.openaiKey
              ? "https://api.openai.com/v1"
              : null;

            if (!apiKey) {
              throw new Error(
                "Chave da OpenAI não configurada. Por favor, adicione sua chave nas configurações."
              );
            }

            const aiClient = new OpenAI({
              apiKey,
              baseURL: baseURL || "https://api.openai.com/v1",
            });
            const completion = await aiClient.chat.completions.create({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: currentPrompt },
              ],
              max_tokens: maxTokens,
              temperature,
              response_format:
                type === "character-generation"
                  ? { type: "json_object" }
                  : undefined,
            });
            result = completion.choices[0]?.message?.content || "";
          }

          if (type === "character-generation") {
            try {
              let jsonStr = result
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

              const firstBrace = jsonStr.indexOf("{");
              const lastBrace = jsonStr.lastIndexOf("}");

              if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
              }

              const parsed = JSON.parse(jsonStr);

              const charSchema = z.object({
                name: z.string(),
                description: z.string().nullable().optional(),
                personality: z.string().nullable().optional(),
                background: z.string().nullable().optional(),
                notes: z.string().nullable().optional(),
              });

              charSchema.parse(parsed);

              // Success!
              result = JSON.stringify(parsed);
              break;
            } catch (e: any) {
              console.log(
                `JSON Validation failed (attempt ${attempts}/${maxRetries}):`,
                e.message
              );
              if (attempts >= maxRetries) {
                // Even if it failed validation, we return the raw result so the user sees something happened,
                // or we could throw. But returning raw allows the frontend to maybe show the error.
                // Actually the user wants correct JSON.
                // If all retries fail, we accept the last result but log it.
                console.error("All retries failed for JSON generation");
              } else {
                currentPrompt += `\n\nERRO: Sua resposta anterior não foi um JSON válido ou não seguiu o schema. Erro: ${e.message}. \nRetorne APENAS o JSON corrigido.`;
                continue; // Retry
              }
            }
          }

          break; // If not character generation or success
        } catch (error) {
          if (attempts >= maxRetries) throw error;
          // If network error, maybe retry?
          // For now only retrying on JSON validation logic as requested.
          throw error;
        }
      }

      const execution = await storage.createExecution({
        userId: user.id,
        promptId: promptId || null,
        storyId: storyId || null,
        scriptId: scriptId || null,
        characterId: characterId || null,
        systemPromptSnapshot: systemPrompt,
        userPrompt,
        finalPrompt: currentPrompt,
        model,
        parameters: { maxTokens, temperature, model },
        result,
      });

      res.json({ execution, result });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const execs = await storage.getExecutions(user.id);
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

  app.post("/api/admin/reset", isAuthenticated, async (req, res) => {
    try {
      const user = await getAppUser(req);
      const { db } = await import("./db");
      const {
        aiExecutions,
        scripts,
        storyCharacters,
        prompts,
        creativeProfiles,
        stories,
        characters,
      } = await import("@shared/schema");
      const { seedDatabase } = await import("./seed");
      const { seedWizardTemplates } = await import("./seed-wizard");
      const { eq, inArray } = await import("drizzle-orm");

      // Delete user-specific data
      await db.delete(aiExecutions).where(eq(aiExecutions.userId, user.id));
      await db
        .delete(scripts)
        .where(
          inArray(
            scripts.storyId,
            db
              .select({ id: stories.id })
              .from(stories)
              .where(eq(stories.userId, user.id))
          )
        );
      await db
        .delete(storyCharacters)
        .where(
          inArray(
            storyCharacters.storyId,
            db
              .select({ id: stories.id })
              .from(stories)
              .where(eq(stories.userId, user.id))
          )
        );
      await db.delete(prompts).where(eq(prompts.userId, user.id));
      await db
        .delete(creativeProfiles)
        .where(eq(creativeProfiles.userId, user.id));
      await db.delete(stories).where(eq(stories.userId, user.id));
      await db.delete(characters).where(eq(characters.userId, user.id));

      await seedDatabase(user.id);
      await seedWizardTemplates(user.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Factory reset error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
