import { storage } from "./storage";

const TEMPLATES = [
  {
    name: "Roteiro: História em Quadrinhos",
    category: "script-template",
    type: "task",
    content:
      "Gere um roteiro dividido em PÁGINAS e PAINÉIS. Cada painel deve ter [DESCRIÇÃO VISUAL] e [DIÁLOGO]. Foque em ritmo visual e narrativa sequencial.",
  },
  {
    name: "Roteiro: Mangá Shonen",
    category: "script-template",
    type: "task",
    content:
      "Gere um roteiro de MANGÁ SHONEN. Use onomatopeias dinâmicas, descrições de enquadramentos de impacto e foco em ação e determinação dos personagens.",
  },
  {
    name: "Roteiro: Prosa Literária",
    category: "script-template",
    type: "task",
    content:
      "Gere uma narrativa em PROSA LITERÁRIA. Foque em descrições sensoriais, monólogos internos e uma estrutura de parágrafos rica e envolvente.",
  },
  {
    name: "Roteiro: Cinema / Screenplay",
    category: "script-template",
    type: "task",
    content:
      "Gere um roteiro no FORMATO PADRÃO DE CINEMA (CENA, CABEÇALHO, AÇÃO, PERSONAGEM, DIÁLOGO). Seja objetivo nas descrições de cena.",
  },
];

const STYLES = [
  {
    name: "Estilo: Turma da Mônica",
    category: "script-style",
    type: "task",
    content:
      "Aplique o estilo 'Turma da Mônica'. Use linguagem infantil, dócil, amigável e inclua tropos como 'planos infalíveis' se apropriado. Mantenha o humor leve.",
  },
  {
    name: "Estilo: Cyberpunk / Neon",
    category: "script-style",
    type: "task",
    content:
      "Aplique uma estética CYBERPUNK. Use termos tecnológicos, ambientação com luzes de neon, chuva, asfalto molhado e uma atmosfera distópica e underground.",
  },
  {
    name: "Estilo: Noir / Investigativo",
    category: "script-style",
    type: "task",
    content:
      "Aplique o clima NOIR. Use narração em primeira pessoa (se possível), sombras profundas, ambiguidade moral e uma linguagem cínica e melancólica.",
  },
];

export async function seedWizardTemplates(userId: number) {
  console.log(`Seeding Wizard templates for user ${userId}...`);

  for (const t of TEMPLATES) {
    await storage.createPrompt({
      ...t,
      userId,
      active: true,
      version: 1,
    });
  }

  for (const s of STYLES) {
    await storage.createPrompt({
      ...s,
      userId,
      active: true,
      version: 1,
    });
  }

  console.log("Wizard templates seeded successfully.");
}
