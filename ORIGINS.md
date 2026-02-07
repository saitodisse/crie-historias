https://chatgpt.com/c/6986b1c4-f7b4-8329-8317-0d90b0d92233

Tudo foi baseado no prompt abaixo.

---

Maravilha. Suas respostas deixaram o **produto cristalino** — agora dá pra transformar isso numa **V1 enxuta, sólida e extensível**, sem “feature creep”.

Vou organizar em 4 partes:

1. 🎯 **Definição clara do produto (V1)**
2. 🧹 **O que entra / o que fica explicitamente fora**
3. 📐 **Especificação Funcional V1 (reescrita e enxugada)**
4. 🗂️ **Modelo conceitual de dados (entidades e relações – sem schema SQL)**

Sem stack, sem imagens, sem firula.

---

# 🎯 1. O QUE É ESSE PRODUTO (V1)

> **Um banco de dados relacional, server-first, para criação e gerenciamento de histórias, roteiros e personagens, orientado por IA, com rastreabilidade total de prompts, modelos e resultados.**

Ele é:

- 🧠 **Criativo**
- 🗃️ **Auditável**
- 🔁 **Reexecutável**
- 👤 **Single-user agora, multi-user-ready**

Não é:

- Um gerador visual
- Um editor de HQ
- Um playground descartável de IA

---

# 🧹 2. ESCOPO: ENTRA vs FICA FORA

## ✅ ENTRA NA V1

- Histórias
- Roteiros
- Personagens
- Prompts configuráveis
- Execuções de IA com histórico completo
- Preferências de modelo por usuário
- Base pronta para SaaS (auth depois)

## ❌ FICA FORA DA V1 (explicitamente)

- Geração de imagens
- Character sheets visuais
- Grounding com Google Search
- Wizard complexo
- Versionamento com merge/diff
- Compartilhamento público
- Templates visuais / UX avançado

👉 Isso evita ambiguidade no futuro.

---

# 📐 3. ESPECIFICAÇÃO FUNCIONAL — V1

## 3.1. Conceito Central

Tudo no sistema gira em torno de **três eixos principais**:

1. **Entidades Criativas** (histórias, personagens, roteiros)
2. **Prompts** (configuráveis, versionáveis)
3. **Execuções de IA** (inputs + outputs + contexto)

---

## 3.2. Gestão de Histórias

### História

Uma **História** é um contêiner criativo.

Ela possui:

- Título
- Premissa
- Tom / gênero (campo livre ou enum)
- Status (rascunho, em desenvolvimento, finalizada)
- Relação com personagens
- Relação com roteiros

Funcionalidades:

- Criar / editar / arquivar
- Associar personagens existentes
- Gerar roteiros a partir dela
- Histórico de execuções de IA relacionadas

---

## 3.3. Estúdio de Personagens (V1 textual)

### Personagem

Personagens são **entidades independentes**, reutilizáveis.

Campos típicos:

- Nome
- Descrição física (texto)
- Personalidade
- Background
- Observações livres

Funcionalidades:

- CRUD completo
- Importar personagem para uma ou mais histórias
- Personagem **não pertence** a uma história específica

⚠️ Nenhuma imagem nesta versão.

---

## 3.4. Roteiros

### Roteiro

Um **Roteiro** é sempre derivado de uma história.

Ele pode representar:

- Sinopse expandida
- Outline
- Roteiro detalhado
- Estrutura por atos/cenas (texto estruturado ou markdown)

Funcionalidades:

- Criar manualmente ou via IA
- Regerar a partir de prompts diferentes
- Associar execuções de IA específicas

---

## 3.5. Prompts (peça-chave do sistema)

### Prompt

Prompts são **entidades de primeira classe**.

Tipos:

- Prompt de sistema
- Prompt de tarefa (ex: “gerar sinopse”)
- Prompt auxiliar (ex: “refinar tom”)

Características:

- Texto totalmente editável
- Categoria (personagem, história, roteiro, refinamento)
- Ativo / inativo
- Versionável (leve)

👉 Prompts **não são hardcoded**.

---

## 3.6. Execuções de IA (núcleo técnico)

### Execução

Cada chamada de IA gera um **registro imutável**.

Ela armazena:

- Prompt do sistema (snapshot)
- Prompt do usuário
- Prompt final montado
- Modelo usado (exato)
- Parâmetros (temperature, etc.)
- Resultado textual
- Timestamp
- Relação com:
  - história
  - roteiro
  - personagem (opcional)
  - prompt base

Funcionalidades:

- Visualizar histórico
- Reexecutar com o mesmo contexto
- Comparar outputs manualmente (fora do sistema)

👉 Isso é o que transforma o produto num **banco de conhecimento criativo**.

---

## 3.7. Preferências de IA / Perfis Criativos

### Perfil Criativo

Um perfil define:

- Modelo preferido
- Parâmetros padrão
- Estilo narrativo desejado (texto)
- Uso padrão de prompts

Funcionalidades:

- Definir perfil padrão
- Sobrescrever por execução
- Persistir última escolha do usuário

---

## 3.8. Usuário (V1 simplificado)

Na V1:

- Um único usuário “local”
- Estrutura já preparada para:
  - autenticação
  - múltiplos usuários
  - chaves próprias de LLM

---

# 🗂️ 4. MODELO CONCEITUAL DE DADOS (ENTIDADES)

Sem SQL, só o **mapa mental**.

---

## Entidades Principais

### User

- id
- nome
- email (futuro)
- preferências globais

---

### CreativeProfile

- id
- user_id
- nome
- modelo padrão
- parâmetros
- ativo

---

### Story

- id
- user_id
- título
- premissa
- tom
- status
- timestamps

---

### Character

- id
- user_id
- nome
- descrição
- personalidade
- background
- ativo

---

### StoryCharacter (N:N)

- story_id
- character_id

---

### Script

- id
- story_id
- tipo (sinopse, outline, roteiro)
- conteúdo
- origem (manual | IA)
- timestamps

---

### Prompt

- id
- user_id
- nome
- categoria
- texto
- versão
- ativo

---

### AIExecution

- id
- user_id
- prompt_id (opcional)
- story_id (opcional)
- script_id (opcional)
- character_id (opcional)
- system_prompt_snapshot
- user_prompt
- final_prompt
- model
- parâmetros
- resultado
- timestamp

---

## Relações-chave

- User → tudo
- Story ↔ Character (N:N)
- Story → Script (1:N)
- Prompt → AIExecution (1:N)
- Script → AIExecution (1:N)

---

# 🧭 Próximo passo (sugestão objetiva)

Se você topar, o próximo passo ideal é **um destes**:

1. 📄 Transformar isso num **README de produto**
2. 🗄️ Desenhar o **schema relacional (Postgres)**
3. 🧠 Definir **tipos de prompts padrão iniciais**
4. 🔄 Definir **fluxos principais de uso (happy path)**

Me diz qual você quer atacar primeiro — e a gente aprofunda sem inflar o escopo.
