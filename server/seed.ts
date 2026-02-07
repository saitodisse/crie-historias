import { storage } from "./storage";

const DEFAULT_USER_ID = 1;

export async function seedDatabase() {
  const existingStories = await storage.getStories(DEFAULT_USER_ID);
  if (existingStories.length > 0) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  const user = await storage.getUserByUsername("creator") || await storage.createUser({ username: "creator", password: "local" });
  const userId = user.id;

  // Personagens
  const char1 = await storage.createCharacter({
    userId,
    name: "Elena Voss",
    description: "Alta, traços angulares, cabelos escuros com mechas prateadas presos em um coque severo. Olhos azul-claros que parecem ver através das pessoas. Uma cicatriz fina traça sua mandíbula esquerda.",
    personality: "Brilhante e metódica, Elena aborda problemas com precisão cirúrgica. Demora a confiar, mas é ferozmente leal uma vez que se conquista seu respeito. Tem um humor seco que pega as pessoas desprevenidas.",
    background: "Ex-analista de inteligência que deixou a agência após uma missão terminar de forma catastrófica. Agora dirige uma firma de investigação privada, mas ainda carrega o peso das vidas que não pôde salvar.",
    notes: "Fala três idiomas. Tem um pesadelo recorrente sobre Praga. Bebe café preto exclusivamente.",
    active: true,
  });

  const char2 = await storage.createCharacter({
    userId,
    name: "Marcus Reeve",
    description: "Físico atarracado, pele marrom quente, cabelo curto com mechas grisalhas nas têmporas. Olhos escuros expressivos, muitas vezes franzidos de diversão. Veste-se impecavelmente mesmo em situações casuais.",
    personality: "Carismático e desarmantemente honesto, Marcus tem o dom de deixar as pessoas à vontade. Por trás do charme esconde-se uma mente estratégica afiada como uma navalha. Ele é do tipo que ri do perigo e depois o neutraliza.",
    background: "Ex-militar que se tornou jornalista e depois articulador político. Ele viu os conflitos mais feios do mundo de perto e emergiu com sua humanidade intacta, embora não ilesa.",
    notes: "Toca piano quando precisa pensar. Tem uma rede de contatos abrangendo cinco continentes.",
    active: true,
  });

  const char3 = await storage.createCharacter({
    userId,
    name: "Lian Zhou",
    description: "Baixa, constituição atlética. Cabelo preto liso geralmente meio escondido sob um boné. Olhos escuros com uma qualidade intensa e vigilante. Várias pequenas tatuagens nos antebraços, cada uma com uma história.",
    personality: "Quieta e observadora, Lian fala raramente, mas com precisão devastadora. Ela é profundamente empática apesar de seu exterior guardado. Quando pressionada, revela uma coragem feroz, quase imprudente.",
    background: "Cresceu nas margens de uma megacidade, autodidata em eletrônica e hacking. Encontrou propósito em expor a corrupção corporativa através do jornalismo investigativo.",
    notes: "Vegetariana. Tem um gato de resgate chamado Byte. Insone que faz seu melhor trabalho às 3 da manhã.",
    active: true,
  });

  const char4 = await storage.createCharacter({
    userId,
    name: "Beatriz Silva",
    description: "Mulher na casa dos 40 anos, olhos expressivos e cabelos cacheados. Sempre carrega um caderno de couro gasto.",
    personality: "Intuitiva, resiliente e extremamente observadora. Possui uma calma contagiante, mesmo em situações de crise.",
    background: "Ex-professora de história que se tornou especialista em restauração de documentos antigos após encontrar um segredo de família.",
    notes: "Fala fluentemente latim e francês. Adora chá de camomila.",
    active: true,
  });

  // Histórias
  const story1 = await storage.createStory({
    userId,
    title: "O Protocolo de Praga",
    premise: "Quando uma operação classificada da Guerra Fria ressurge na Praga moderna, a ex-analista de inteligência Elena Voss deve confrontar os fantasmas de seu passado enquanto corre para evitar um incidente internacional que poderia remodelar o equilíbrio de poder global.",
    tone: "Thriller Político, Espionagem",
    status: "in-development",
  });

  const story2 = await storage.createStory({
    userId,
    title: "Sombras de Neon",
    premise: "Em uma metrópole cyberpunk em expansão, a jornalista investigativa Lian Zhou descobre uma conspiração ligando uma poderosa corporação a uma série de desaparecimentos misteriosos na classe baixa da cidade. Quanto mais ela investiga, mais percebe que a conspiração alcança a infraestrutura digital que controla todos os aspectos da vida urbana.",
    tone: "Cyberpunk Noir, Ficção Científica",
    status: "draft",
  });

  const story3 = await storage.createStory({
    userId,
    title: "O Gambito do Diplomata",
    premise: "O articulador político Marcus Reeve é contratado para mediar a paz em uma nação africana volátil, mas descobre que o conflito está sendo deliberadamente arquitetado por potências externas. Ele deve navegar por uma teia de traição onde cada aliado pode ser um inimigo.",
    tone: "Drama Político, Thriller Internacional",
    status: "draft",
  });

  const story4 = await storage.createStory({
    userId,
    title: "O Segredo do Arquivo Nacional",
    premise: "Beatriz Silva descobre um mapa oculto em um documento do século XVIII que aponta para um tesouro esquecido no coração da Amazônia.",
    tone: "Aventura, Mistério",
    status: "in-development",
  });

  // Vínculos
  await storage.addStoryCharacter({ storyId: story1.id, characterId: char1.id });
  await storage.addStoryCharacter({ storyId: story1.id, characterId: char2.id });
  await storage.addStoryCharacter({ storyId: story2.id, characterId: char3.id });
  await storage.addStoryCharacter({ storyId: story3.id, characterId: char2.id });
  await storage.addStoryCharacter({ storyId: story4.id, characterId: char4.id });

  // Roteiros
  await storage.createScript({
    storyId: story1.id,
    title: "Protocolo Praga - Sinopse",
    type: "synopsis",
    content: `ATO UM: O DESPERTAR\n\nElena Voss construiu uma vida tranquila administrando sua firma de investigação privada em Berlim. Sua paz cuidadosamente construída estilhaça quando um pacote misterioso chega contendo um documento classificado da Operação Nightfall — uma missão que lhe disseram ter sido permanentemente enterrada.`,
    origin: "manual",
  });

  await storage.createScript({
    storyId: story4.id,
    title: "Sinopse - O Segredo do Arquivo Nacional",
    type: "synopsis",
    content: "A história começa quando Beatriz, ao restaurar um diário de um explorador português, encontra coordenadas geográficas escondidas sob uma camada de tinta invisível. Ela parte em uma jornada perigosa para validar sua descoberta.",
    origin: "manual",
  });

  // Prompts
  await storage.createPrompt({
    userId,
    name: "Gerador Criativo de Sinopses",
    category: "story",
    type: "system",
    content: "Você é um roteirista especializado e arquiteto de histórias. Ao ser solicitado a gerar uma sinopse, crie uma estrutura narrativa atraente com atos claros, tensão crescente e resolução satisfatória.",
    active: true,
  });

  // Perfis
  await storage.createProfile({
    userId,
    name: "Explorador Criativo",
    model: "gpt-5-mini",
    temperature: "0.9",
    maxTokens: 4096,
    narrativeStyle: "Prosa literária rica com atenção aos detalhes sensoriais. Prefira mostrar a contar.",
    active: true,
  });

  console.log("Seed data created successfully");
}
