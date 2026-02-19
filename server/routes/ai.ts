import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getAppUser } from "./utils";
import OpenAI from "openai";
import { GoogleBillingService } from "../services/googleBilling";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { encrypt, decrypt } from "../crypto";
import { z } from "zod";

const router = Router();

router.get("/user/keys", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({
      hasOpenai: !!user.openaiKey,
      hasGemini: !!user.geminiKey,
      hasOpenrouter: !!user.openrouterKey,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/user/keys", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
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

router.get("/models/:provider", isAuthenticated, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

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
          "gemini-3.1-pro-preview",
          "gemini-3-pro-preview",
          "gemini-3-flash-preview",
          "gemini-3-pro-image-preview",
          "gemini-flash-latest",
          "gemini-flash-lite-latest",
          "imagen-4.0-generate-001",
          "imagen-4.0-ultra-generate-001",
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

router.post("/ai/generate", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let {
      projectId,
      characterId,
      scriptId,
      promptId,
      promptIds,
      userPrompt,
      type,
    } = req.body;

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
        "Você é um especialista em estruturação de histórias (Project Architect). Sua tarefa é expandir ideias embrionárias em títulos cativantes e premissas sólidas, mantendo um diálogo construtivo com o autor através de perguntas inteligentes. Sempre peça feedback ou faça perguntas ao final.";
    } else if (type === "wizard-script") {
      "Você é um roteirista profissional. Sua tarefa é produzir roteiros completos e detalhados seguindo o formato e estilo solicitados.\n\n" +
        "Retorne APENAS o conteúdo do roteiro formatado em Markdown.\n" +
        "NÃO utilize JSON.\n" +
        "NÃO inclua textos introdutórios ou conversas.\n" +
        "Se possível, inclua um título no topo do roteiro usando # Título.";
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
    } else if (type === "script-adjustment") {
      systemPrompt =
        "Você é um editor de roteiros experiente. Sua tarefa é ajustar o conteúdo do roteiro seguindo as instruções do usuário.\n" +
        "Retorne APENAS o conteúdo do roteiro ajustado/reescrito.\n" +
        "NÃO inclua textos introdutórios como 'Aqui está o roteiro' ou 'Certo'.\n" +
        "NÃO use formatação de bloco de código (```) a menos que faça parte do roteiro.";
    } else {
      systemPrompt = "Você é um assistente de escrita criativa habilidoso. ";
    }

    if (
      profile?.narrativeStyle &&
      type !== "character-generation" &&
      type !== "character-generation"
    ) {
      systemPrompt += ` Escreva neste estilo predominante: ${profile.narrativeStyle}.`;
    }

    // For structured generation, append explicit JSON instruction to user prompt
    if (type === "character-generation") {
      userPrompt = `${userPrompt}\n\nIMPORTANTE: Retorne APENAS um JSON válido seguindo estritamente o schema solicitado.`;
    }

    let project, character, script, promptRecord;

    if (projectId) {
      project = await storage.getProject(projectId);
      if (project) {
        contextParts.push(`Projeto: "${project.title}"`);
        if (project.premise) contextParts.push(`Premissa: ${project.premise}`);
        if (project.tone) contextParts.push(`Tom/Gênero: ${project.tone}`);
        const chars = await storage.getProjectCharacters(projectId);
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

    // Handle multiple prompts
    let additionalInstructions = "";
    if (promptIds && Array.isArray(promptIds) && promptIds.length > 0) {
      const selectedPrompts = await storage.getPromptsByIds(promptIds);
      const systemParts = selectedPrompts
        .filter((p) => p.type === "system")
        .map((p) => p.content);
      const otherParts = selectedPrompts
        .filter((p) => p.type !== "system")
        .map((p) => `[Prompt: ${p.name} (${p.type})]:\n${p.content}`);

      if (systemParts.length > 0) {
        systemPrompt +=
          (systemPrompt.length > 0 ? "\n---\n" : "") +
          systemParts.join("\n---\n");
      }

      if (otherParts.length > 0) {
        additionalInstructions =
          "\n\nInstruções Adicionais:\n" + otherParts.join("\n\n");
      }
    }

    let currentPrompt =
      contextParts.length > 0
        ? `Contexto:\n${contextParts.join("\n")}\n\nSolicitação: ${userPrompt}${additionalInstructions}`
        : `${userPrompt}${additionalInstructions}`;

    // Inject Global Prompts
    const globalPrompts = await storage.getActivePromptsByCategory(
      user.id,
      "GLOBAL"
    );
    if (globalPrompts.length > 0) {
      const globalContent = globalPrompts.map((p) => p.content).join("\n---\n");
      systemPrompt =
        globalContent + (systemPrompt ? "\n---\n" + systemPrompt : "");
    }

    console.log(
      `\x1b[35m[AI LLM Call]\x1b[0m Model: ${model}, Temperature: ${temperature}`
    );
    console.log(`\x1b[34m[System Prompt]\x1b[0m\n${systemPrompt}`);
    console.log(`\x1b[33m[User Prompt]\x1b[0m\n${currentPrompt}`);

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
          const baseURL = user?.openaiKey ? "https://api.openai.com/v1" : null;

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

        console.log(`\x1b[32m[AI LLM Response]\x1b[0m\n${result}`);

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

            if (type === "character-generation") {
              const charSchema = z.object({
                name: z.string(),
                description: z.string().nullable().optional(),
                personality: z.string().nullable().optional(),
                background: z.string().nullable().optional(),
                notes: z.string().nullable().optional(),
              });
              charSchema.parse(parsed);
            }

            // Success!
            result = JSON.stringify(parsed);
            break;
          } catch (e: any) {
            console.log(
              `JSON Validation failed for type ${type} (attempt ${attempts}/${maxRetries}):`,
              e.message
            );
            if (attempts >= maxRetries) {
              console.error("All retries failed for JSON generation");
              throw new Error(
                `Falha ao gerar um JSON válido após ${maxRetries} tentativas: ${e.message}`
              );
            } else {
              currentPrompt += `\n\nERRO: Sua resposta anterior não foi um JSON válido ou não seguiu o schema. Erro: ${e.message}. \nRetorne APENAS o JSON corrigido.`;
              continue; // Retry
            }
          }
        } else {
          break; // Normal text generation
        }
      } catch (error) {
        if (attempts >= maxRetries) throw error;
        // If network error, maybe retry?
        // For now only retrying on JSON validation logic as requested.
        throw error;
      }
    }

    const execution = await storage.createExecution({
      userId: user.id,
      promptId: promptRecord ? promptRecord.id : null,
      promptIds: promptIds || null,
      projectId: project ? project.id : null,
      scriptId: script ? script.id : null,
      characterId: character ? character.id : null,
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

router.get("/executions", isAuthenticated, async (req, res) => {
  try {
    const user = await getAppUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const execs = await storage.getExecutions(user.id);
    const enriched = await Promise.all(
      execs.map(async (e) => {
        const [project, character, script, prompt] = await Promise.all([
          e.projectId ? storage.getProject(e.projectId) : undefined,
          e.characterId ? storage.getCharacter(e.characterId) : undefined,
          e.scriptId ? storage.getScript(e.scriptId) : undefined,
          e.promptId ? storage.getPrompt(e.promptId) : undefined,
        ]);
        return {
          ...e,
          projectTitle: project?.title,
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

export default router;
