import { storage } from "./storage";
import {
  STORY_TONES,
  THEME_PRESETS,
  STYLE_PRESETS,
  getSystemInstruction,
} from "../shared/creative-constants";

const DEFAULT_USER_ID = 1;

async function ensureSeedUser(preferredUserId?: number) {
  if (preferredUserId) {
    const userById = await storage.getUser(preferredUserId);
    if (userById) return userById;
  }

  const externalAuthId = process.env.DEV_AUTH_USER_ID || "local-dev-user";
  return storage.getOrCreateUserByExternalAuthId(
    externalAuthId,
    "local",
    "Dev User"
  );
}

export async function seedDatabase(userId: number = DEFAULT_USER_ID) {
  const seedUser = await ensureSeedUser(userId);
  const effectiveUserId = seedUser.id;

  const existingStories = await storage.getStories(effectiveUserId);
  if (existingStories.length > 0) {
    console.log(
      `Database already has data for user ${effectiveUserId}, skipping seed.`
    );
    return;
  }

  // Personagens (Arquétipos de HQ)
  const char1 = await storage.createCharacter({
    userId: effectiveUserId,
    name: "Sombra da Noite",
    description:
      "Veste um traje tático preto fosco com detalhes em roxo escuro. Uma capa esfarrapada que parece se fundir com as sombras. Máscara que cobre apenas os olhos, revelando um olhar determinado.",
    personality:
      "Estóico, observador e implacável contra o crime. Evita violência letal, mas usa o medo como sua principal ferramenta. Fala pouco, agindo com precisão milimétrica.",
    background:
      "Um ex-detetive que se cansou da corrupção no sistema e decidiu agir por conta própria. Sua base é um bunker escondido sob uma antiga fábrica de brinquedos.",
    notes: "Especialista em artes marciais e gadgets tecnológicos.",
    active: true,
  });

  const char2 = await storage.createCharacter({
    userId: effectiveUserId,
    name: "Nova Lux",
    description:
      "Cabelos loiros platinados que brilham levemente. Olhos dourados. Traje tecnológico branco e dourado com circuitos visíveis que emitem luz quando ela usa seus poderes.",
    personality:
      "Otimista, corajosa e por vezes um pouco ingênua sobre a maldade do mundo. Acredita no potencial de redenção de todos.",
    background:
      "Uma cientista que sofreu um acidente com um acelerador de partículas e ganhou a habilidade de manipular fótons e luz sólida.",
    notes: "Pode voar e criar escudos de luz.",
    active: true,
  });

  // Histórias Exemplo
  const story1 = await storage.createStory({
    userId: effectiveUserId,
    title: "O Crepúsculo de Neon",
    premise:
      "Em uma cidade onde o sol nunca brilha através da poluição, Sombra da Noite deve impedir que uma nova droga digital escravize a população, enquanto Nova Lux tenta provar que há esperança mesmo nas sombras mais profundas.",
    tone: "Mistério Noir, Ação Frenética",
    status: "in-development",
  });

  // Vínculos
  await storage.addStoryCharacter({
    storyId: story1.id,
    characterId: char1.id,
  });
  await storage.addStoryCharacter({
    storyId: story1.id,
    characterId: char2.id,
  });

  // Roteiros (Exemplo de Página 1)
  await storage.createScript({
    storyId: story1.id,
    title: "Página 1 - A Chegada",
    type: "detailed",
    content: `[PÁGINA 1]\n\nPAINEL 1: Plano geral da cidade sob chuva de neon. Sombra da Noite observa do topo de um gárgula.\n\nPAINEL 2: Close no rosto de Sombra da Noite. Ele detecta um movimento suspeito.\n\nPAINEL 3: Ele salta para o abismo, a capa se abrindo como asas de morcego.`,
    origin: "manual",
  });

  // Biblioteca de Prompts (Baseado nos Presets)
  for (const preset of THEME_PRESETS) {
    await storage.createPrompt({
      userId: effectiveUserId,
      name: `Template: ${preset.label}`,
      category: "story",
      type: "task",
      content: preset.prompt,
      active: true,
    });
  }

  // Prompt Mestre de Quadrinhos
  await storage.createPrompt({
    userId: effectiveUserId,
    name: "Gerador Profissional de HQ (Padrão)",
    category: "script",
    type: "system",
    content: getSystemInstruction(4, "Aventura Épica"),
    active: true,
  });

  // Perfis Criativos (Baseado nos Style Presets)
  // Criaremos 3 perfis principais para não poluir demais, mas representativos
  await storage.createProfile({
    userId: effectiveUserId,
    name: "Estilo Marvel/DC (Moderno)",
    model: "gpt-4o",
    temperature: "0.8",
    maxTokens: 4096,
    narrativeStyle:
      "HQ Moderna da Marvel, colorido digital, estilo Jim Lee/Todd McFarlane",
    active: true,
  });

  await storage.createProfile({
    userId: effectiveUserId,
    name: "Mangá Shonen (Dinâmico)",
    model: "gpt-4o-mini",
    temperature: "0.9",
    maxTokens: 4096,
    narrativeStyle:
      "Mangá Shonen moderno, traço detalhado, efeitos cinematográficos",
    active: false,
  });

  await storage.createProfile({
    userId: effectiveUserId,
    name: "Noir Clássico (Sombrio)",
    model: "gpt-4-turbo",
    temperature: "0.7",
    maxTokens: 2048,
    narrativeStyle:
      "HQ Noir, alto contraste, sombras profundas, estilo Frank Miller",
    active: false,
  });

  console.log("Seed data updated with Comic Book presets successfully");
}
