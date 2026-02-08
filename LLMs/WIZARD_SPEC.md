# Especificação Funcional e Técnica: Wizard de Criação de Histórias

Este documento descreve a especificação para o novo fluxo "Wizard" do StoryForge, focado em uma experiência lúdica, simples e guiada por IA.

---

## 1. Visão Geral

O objetivo é transformar o processo de criação de histórias, que hoje é manual e fragmentado, em um fluxo contínuo e assistido ("Wizard"). O usuário deve sentir que está conversando com a IA, onde ele fornece a semente (ideia inicial), escolhe os ingredientes (personagens, estilo) e a IA entrega o bolo pronto (roteiro).

**Princípios:**

- **Lúdico e Simples**: Interface limpa, foco no conteúdo, botões de ação claros ("Próximo").
- **AI-First**: A IA faz o trabalho pesado de expansão e estruturação.
- **Persistência Híbrida**: Dados pesados no Banco de Dados, Navegação guiada por Query Strings (Ids).

---

## 2. Especificação Funcional

O Wizard será composto por 3 etapas principais.

### Etapa 1: A Ideia (The Spark)

- **Entrada**: Um campo de texto simples onde o usuário digita sua ideia inicial (ex: "Um detetive que descobre que é um fantasma").
- **Ação da IA**: Ao clicar em "Iniciar", a IA expande essa ideia em uma **Premissa**, **Título Sugerido** e **Tom**.
  - **Interatividade**: A IA gera uma versão inicial e **finaliza com perguntas** para refinar a história (ex: "Você prefere que o tom seja mais investigativo ou sobrenatural?").
- **Refinamento**: O usuário responde às perguntas ou pede ajustes via chat.
- **Saída**: Criação de um registro em `Stories` com status `draft`.

### Etapa 2: O Elenco (The Cast)

- **Contexto**: A história criada na etapa anterior (`?storyId=123`).
- **Interface**: Uma galeria dos personagens já existentes do usuário (`Characters`).
- **Criação Rápida**: Botão "Novo Personagem" que abre em **nova aba** para não perder o fluxo do Wizard. O usuário cria, salva, fecha a aba e recarrega a lista no Wizard.
- **Ação**: O usuário seleciona quais personagens participarão dessa história.
- **Identificação**: Cada personagem selecionado é vital para o próximo passo. A IA precisa saber quem é quem (Nome, Papel, ID).
- **Saída**: Criação de registros em `StoryCharacters` vinculando os selecionados à história.

### Etapa 3: O Roteiro (The Script)

- **Contexto**: História + Personagens vinculados (`?storyId=123&charIds=...`).
- **Seleção de Estilo/Template**: O usuário escolhe o formato final a partir de uma lista dinâmica (vinda do banco de dados).
  - _Exemplos_: "História em Quadrinhos", "Mangá", "Prosa", "Roteiro de Cinema".
- **Prompt de Estrutura/Tema**: O usuário pode aplicar "lentes" adicionais (ex: "Estilo Turma da Mônica", "Cyberpunk", "Jornada do Herói").
- **Ação da IA**: Gera o conteúdo do roteiro (`Scripts`) baseando-se na História (Etapa 1), Personagens (Etapa 2) e Template (Etapa 3).
- **Resultado**: O usuário é redirecionado para um **Editor de Texto** (Markdown) com o roteiro gerado, pronto para ajustes finais.
- **Identificação Visual**: Uso de tags textuais claras (ex: **[MÔNICA]**) para identificar falas e ações.

---

## 3. Especificação Técnica

### Fluxo de Dados e Estado

O estado da navegação será mantido na URL (Query String), garantindo que o usuário possa atualizar a página sem perder o contexto do fluxo, mas os dados gerados são salvos imediatamente no servidor.

**Fluxo de Navegação:**

1.  `/wizard/idea`
    - _Input_: Nenhum.
    - _Submit_: `POST /api/stories` (cria story draft).
    - _Redirect_: `/wizard/characters?storyId={new_story_id}`.

2.  `/wizard/characters`
    - _Input_: `storyId` (URL).
    - _Data_: `GET /api/characters` (lista todos), `GET /api/stories/{id}` (contexto).
    - _Action_: Botão "Criar Novo" com `target="_blank"`.
    - _Submit_: `POST /api/stories/{id}/characters` (para cada selecionado).
    - _Redirect_: `/wizard/script?storyId={id}`.

3.  `/wizard/script`
    - _Input_: `storyId` (URL).
    - _Data_: `GET /api/prompts` (filtro `category='template'` ou `category='style'`).
    - _Submit_: `POST /api/ai/generate` (gera conteúdo), depois `POST /api/scripts` (salva).
    - _Redirect_: `/scripts/{id}` (Editor de Texto Markdown).

### Integração com IA

Utilizaremos a rota existente `/api/ai/generate` com payloads enriquecidos.

- **Templates como Prompts**:
  - Criaremos registros iniciais na tabela `Prompts` para: HQ, Mangá, Prosa, Cinema.
  - Esses templates serão **editáveis** na tela de Prompts existente `/prompts`.
  - _Exemplo Template HQ_: _"Gere um roteiro dividido em páginas e painéis. Para cada painel, descreva a cena visualmente (VISUAL) e o texto/diálogo (TEXTO)."_

- **Gerador de Ideias (Etapa 1)**:
  - Novo Prompt de Sistema: _"Você é um assistente criativo. Expanda a ideia do usuário em Premissa, Título e Tom. Ao final, FAÇA 2-3 PERGUNTAS para ajudar o usuário a refinar a ideia."_

### Banco de Dados (Schema existente)

Não são necessárias alterações estruturais no banco de dados (`shared/schema.ts`).
Utilizaremos `Prompts` com `category` específica para listar os templates na Etapa 3.

---
