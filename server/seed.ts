import { storage } from "./storage";

export async function seedDatabase() {
  const existingUser = await storage.getUserByUsername("creator");
  if (existingUser) {
    const existingStories = await storage.getStories(existingUser.id);
    if (existingStories.length > 0) return;
  }

  const user = existingUser || await storage.createUser({ username: "creator", password: "local" });
  const userId = user.id;

  const char1 = await storage.createCharacter({
    userId,
    name: "Elena Voss",
    description: "Tall, angular features, silver-streaked dark hair pulled back in a severe bun. Pale blue eyes that seem to see through people. A thin scar traces her left jawline.",
    personality: "Brilliant and methodical, Elena approaches problems with surgical precision. She's slow to trust but fiercely loyal once you earn her respect. Has a dry wit that catches people off guard.",
    background: "Former intelligence analyst who left the agency after a mission went catastrophically wrong. Now runs a private investigation firm, but still carries the weight of the lives she couldn't save.",
    notes: "Speaks three languages. Has a recurring nightmare about Prague. Drinks black coffee exclusively.",
    active: true,
  });

  const char2 = await storage.createCharacter({
    userId,
    name: "Marcus Reeve",
    description: "Stocky build, warm brown skin, close-cropped hair with patches of gray at the temples. Expressive dark eyes, often crinkled with amusement. Dresses impeccably even in casual settings.",
    personality: "Charismatic and disarmingly honest, Marcus has a gift for making people feel at ease. Beneath the charm lies a razor-sharp strategic mind. He's the type to laugh at danger, then neutralize it.",
    background: "Ex-military turned journalist turned political fixer. He's seen the world's ugliest conflicts up close and emerged with his humanity intact, though not unscathed.",
    notes: "Plays piano when he needs to think. Has a network of contacts spanning five continents.",
    active: true,
  });

  const char3 = await storage.createCharacter({
    userId,
    name: "Lian Zhou",
    description: "Petite, athletic build. Straight black hair usually half-hidden under a cap. Dark eyes with an intense, watchful quality. Multiple small tattoos on her forearms, each with a story.",
    personality: "Quiet and observant, Lian speaks rarely but with devastating precision. She's deeply empathetic despite her guarded exterior. When pushed, she reveals a fierce, almost reckless courage.",
    background: "Grew up in the margins of a megacity, self-taught in electronics and hacking. Found purpose in exposing corporate corruption through investigative journalism.",
    notes: "Vegetarian. Has a rescue cat named Byte. Insomniac who does her best work at 3 AM.",
    active: true,
  });

  const story1 = await storage.createStory({
    userId,
    title: "The Prague Protocol",
    premise: "When a classified Cold War operation resurfaces in modern-day Prague, former intelligence analyst Elena Voss must confront the ghosts of her past while racing to prevent an international incident that could reshape the global power balance.",
    tone: "Political Thriller, Espionage",
    status: "in-development",
  });

  const story2 = await storage.createStory({
    userId,
    title: "Neon Shadows",
    premise: "In a sprawling cyberpunk metropolis, investigative journalist Lian Zhou uncovers a conspiracy linking a powerful corporation to a series of mysterious disappearances in the city's underclass. The deeper she digs, the more she realizes the conspiracy reaches into the digital infrastructure that controls every aspect of urban life.",
    tone: "Cyberpunk Noir, Science Fiction",
    status: "draft",
  });

  const story3 = await storage.createStory({
    userId,
    title: "The Diplomat's Gambit",
    premise: "Political fixer Marcus Reeve is hired to broker peace in a volatile African nation, but discovers that the conflict is being deliberately engineered by external powers. He must navigate a web of betrayal where every ally could be an enemy.",
    tone: "Political Drama, International Thriller",
    status: "draft",
  });

  await storage.addStoryCharacter({ storyId: story1.id, characterId: char1.id });
  await storage.addStoryCharacter({ storyId: story1.id, characterId: char2.id });
  await storage.addStoryCharacter({ storyId: story2.id, characterId: char3.id });
  await storage.addStoryCharacter({ storyId: story3.id, characterId: char2.id });

  await storage.createScript({
    storyId: story1.id,
    title: "Prague Protocol - Synopsis",
    type: "synopsis",
    content: `ACT ONE: THE AWAKENING

Elena Voss has built a quiet life running her private investigation firm in Berlin. Her carefully constructed peace shatters when a mysterious package arrives containing a classified document from Operation Nightfall — a mission she was told had been permanently buried.

The document reveals that a key asset from the operation, someone she believed dead, is alive and in Prague. Before she can process this revelation, she receives a call from her former handler at the agency, warning her that "the protocol has been activated."

ACT TWO: THE DESCENT

Elena travels to Prague, where she reconnects with Marcus Reeve, now working as a journalist covering Eastern European politics. Together, they begin to unravel the threads of a conspiracy that connects Cold War-era intelligence operations to a modern-day power play involving NATO, Russian oligarchs, and a shadowy private intelligence firm.

As they dig deeper, Elena discovers that Operation Nightfall was far more extensive than she knew — and that her role in it was not what she was led to believe.

ACT THREE: THE RECKONING

The truth forces Elena to choose between exposing the conspiracy and protecting the people she cares about. In a climactic confrontation in the tunnels beneath Prague Castle, she must face both the physical threat of the conspirators and the psychological weight of her past decisions.`,
    origin: "manual",
  });

  await storage.createScript({
    storyId: story2.id,
    title: "Neon Shadows - Outline",
    type: "outline",
    content: `Chapter 1: The Signal
- Lian receives an encrypted tip about missing workers from the Undercity
- She begins investigating, posing as a temp worker at NovaCorp

Chapter 2: Below the Grid
- Discovery of unauthorized neural modification facilities
- First encounter with the underground resistance

Chapter 3: Digital Ghost
- Lian's identity is compromised in the corporate network
- She goes off-grid, relying on analog methods

Chapter 4: The Architecture of Control
- Revelation of NovaCorp's true project: predictive behavior control through city infrastructure
- The missing people are unwilling test subjects

Chapter 5: Breaking Through
- Lian must choose between publishing the story (risking the subjects) or staging a rescue (risking everything)`,
    origin: "manual",
  });

  await storage.createPrompt({
    userId,
    name: "Creative Synopsis Generator",
    category: "story",
    type: "system",
    content: "You are an expert screenwriter and story architect. When asked to generate a synopsis, create a compelling narrative structure with clear acts, rising tension, and satisfying resolution. Use vivid language and focus on character motivations driving the plot forward. Include key turning points and emotional beats.",
    active: true,
  });

  await storage.createPrompt({
    userId,
    name: "Character Development",
    category: "character",
    type: "task",
    content: "Develop this character further. Consider their internal contradictions, what they want vs. what they need, their relationship patterns, and how their background shapes their worldview. Provide specific behavioral details that make them feel real and three-dimensional.",
    active: true,
  });

  await storage.createPrompt({
    userId,
    name: "Dialogue Polisher",
    category: "script",
    type: "auxiliary",
    content: "Review and enhance the dialogue in this script. Ensure each character has a distinct voice. Remove exposition dumps and replace them with subtext-rich exchanges. Add rhythm and pacing variety. Make sure every line serves either character development or plot advancement.",
    active: true,
  });

  await storage.createPrompt({
    userId,
    name: "Tone Refinement",
    category: "refinement",
    type: "auxiliary",
    content: "Analyze and refine the tone of this text. Ensure consistency throughout while maintaining dynamic range. Identify passages where the tone shifts unintentionally and suggest corrections. Preserve the author's voice while enhancing emotional impact.",
    active: true,
  });

  await storage.createProfile({
    userId,
    name: "Creative Explorer",
    model: "gpt-5-mini",
    temperature: "0.9",
    maxTokens: 4096,
    narrativeStyle: "Rich, literary prose with attention to sensory detail. Favor showing over telling. Use varied sentence structures and occasional unconventional metaphors.",
    active: true,
  });

  await storage.createProfile({
    userId,
    name: "Concise Outliner",
    model: "gpt-5-nano",
    temperature: "0.5",
    maxTokens: 2048,
    narrativeStyle: "Clear, structured, and efficient. Focus on plot mechanics and story architecture. Minimal embellishment, maximum clarity.",
    active: false,
  });

  // Novos dados em PT-BR
  const charPT1 = await storage.createCharacter({
    userId,
    name: "Beatriz Silva",
    description: "Mulher na casa dos 40 anos, olhos expressivos e cabelos cacheados. Sempre carrega um caderno de couro gasto.",
    personality: "Intuitiva, resiliente e extremamente observadora. Possui uma calma contagiante, mesmo em situações de crise.",
    background: "Ex-professora de história que se tornou especialista em restauração de documentos antigos após encontrar um segredo de família.",
    notes: "Fala fluentemente latim e francês. Adora chá de camomila.",
    active: true,
  });

  const storyPT1 = await storage.createStory({
    userId,
    title: "O Segredo do Arquivo Nacional",
    premise: "Beatriz Silva descobre um mapa oculto em um documento do século XVIII que aponta para um tesouro esquecido no coração da Amazônia.",
    tone: "Aventura, Mistério",
    status: "in-development",
  });

  await storage.addStoryCharacter({ storyId: storyPT1.id, characterId: charPT1.id });

  await storage.createScript({
    storyId: storyPT1.id,
    title: "Sinopse - O Segredo do Arquivo Nacional",
    type: "synopsis",
    content: "A história começa quando Beatriz, ao restaurar um diário de um explorador português, encontra coordenadas geográficas escondidas sob uma camada de tinta invisível. Ela parte em uma jornada perigosa para validar sua descoberta.",
    origin: "manual",
  });

  console.log("Seed data created successfully");
}
