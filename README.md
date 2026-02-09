# Crie Histórias

## Estudio de Escrita Criativa

AI-powered creative writing platform for managing stories, characters, and scripts with full prompt auditability. Supports OpenAI, Gemini, and OpenRouter with user-managed API keys (AES-256-CBC encrypted). Interface em português brasileiro (PT-BR).

---

## Execução Local

O projeto utiliza PostgreSQL/Neon e autenticação via Clerk (com fallback local para desenvolvimento).

- **Banco**: PostgreSQL via `DATABASE_URL` (Neon recomendado).
- **Auth**:
  - Com `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY`: usa Clerk.
  - Sem essas variáveis: usa usuário local de desenvolvimento automaticamente.

### Setup Rápido

```bash
npm install
copy .env.example .env
npm run db:push
npm run dev
```

---

## Indice

- [Visao Geral](#visao-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack Tecnologico](#stack-tecnologico)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Modelo de Dados](#modelo-de-dados)
- [Autenticacao](#autenticacao)
- [Integracao com IA](#integracao-com-ia)
- [Perfis Criativos](#perfis-criativos)
- [Gerenciamento de Dados](#gerenciamento-de-dados)
- [Gerenciamento de Chaves de API](#gerenciamento-de-chaves-de-api)
- [Auditabilidade de Prompts](#auditabilidade-de-prompts)
- [Rotas da API](#rotas-da-api)
- [Tema e Design](#tema-e-design)
- [Como Executar](#como-executar)
- [Variaveis de Ambiente](#variaveis-de-ambiente)

---

## Visao Geral

O Crie Histórias e uma plataforma completa para escritores criativos que combina gerenciamento de projetos literarios com geracao de conteudo por IA. Cada historia pode ter personagens reutilizaveis, roteiros em diferentes niveis de detalhe e prompts salvos para interacao com multiplos provedores de IA.

A plataforma registra cada interacao com IA de forma auditavel, armazenando o prompt de sistema, o prompt do usuario, o prompt final montado, os parametros do modelo e o resultado obtido.

---

## Funcionalidades

### Gerenciamento de Historias

- Criar, editar e excluir historias com titulo, premissa, tom e status
- Status de progresso: rascunho, em desenvolvimento, completo
- Vincular personagens existentes a uma historia (relacao muitos-para-muitos)
- Visualizar roteiros e personagens associados na pagina de detalhe

### Gerenciamento de Personagens

- Criar personagens independentes reutilizaveis entre historias
- Campos: nome, descricao, personalidade, background, notas
- Ativar/desativar personagens
- Gerar descricoes de personagens com IA

### Roteiros (Scripts)

- Criar roteiros vinculados a historias
- Tipos: sinopse, outline, detalhado
- Origem: manual ou gerado por IA
- Editor de conteudo integrado com geracao assistida por IA

### Biblioteca de Prompts

- Salvar e versionar prompts para reutilizacao
- Categorias e tipos configuravais (tarefa, sistema, contexto)
- Versionamento automatico: incrementa versao quando o conteudo muda
- Ativar/desativar prompts

### Geracao de Conteudo com IA

- Suporte a tres provedores: OpenAI, Google Gemini e OpenRouter
- Dialogo de geracao inline com observabilidade completa
- Visualizacao do prompt enviado, prompt de sistema, parametros e resultado
- Botoes de copiar para prompt e resultado
- Aviso visual quando o resultado retorna vazio
- Botao "Novo Prompt" para iterar rapidamente
- Badges mostrando modelo, temperatura e tokens maximos usados

### Perfis Criativos

- Configurar preferencias de modelo de IA por perfil
- Campos: modelo, temperatura, tokens maximos, estilo narrativo
- Seletor de perfil ativo na barra lateral
- Visualizacao do modelo e temperatura do perfil ativo
- Um perfil ativo por usuario
- Gerenciado na pagina de Configuracoes

### Gerenciamento de Dados

- **Exportacao:** Backup completo dos dados (projetos, personagens, roteiros, etc.) em formato JSON. (Chaves de API e senhas nao sao exportadas por seguranca).
- **Importacao:** Restaura os dados do backup. As chaves de API atuais sao preservadas para os usuários correspondentes. Atencao: substitui todos os outros dados (projetos, historico, etc.).
- **Factory Reset:** Limpa todos os dados do usuario e restaura o estado inicial do sistema.

### Historico de Execucoes

- Registro completo de cada chamada a IA
- Armazena: prompt de sistema, prompt do usuario, prompt final, modelo, parametros (temperatura, tokens, modelo) e resultado
- Visualizacao cronologica de todas as execucoes
- Rastreabilidade completa para auditoria

### Perfil do Usuario

- Configuracao de chaves de API (OpenAI, Gemini, OpenRouter)
- Chaves criptografadas com AES-256-CBC
- Gerenciamento de perfis criativos

---

## Arquitetura

```
Cliente (React + Vite)
    |
    |-- TanStack Query (cache e fetching)
    |-- wouter (roteamento SPA)
    |-- shadcn/ui + Tailwind CSS (componentes e estilo)
    |
    v
Servidor (Express.js + TypeScript)
    |
    |-- Rotas REST API
    |-- Clerk Auth (com fallback local em desenvolvimento)
    |-- Drizzle ORM
    |-- Integração IA (OpenAI / Gemini / OpenRouter)
    |
    v
PostgreSQL (Neon)
```

O frontend e o backend rodam no mesmo servidor Express na porta 5000. Em desenvolvimento, o Vite serve o frontend com HMR. Em produção, os assets são pré-compilados e servidos como arquivos estáticos.

---

## Stack Tecnologico

### Frontend

| Tecnologia        | Uso                                 |
| ----------------- | ----------------------------------- |
| React 18          | Biblioteca de UI                    |
| Vite 7            | Build tool e dev server             |
| TypeScript        | Tipagem estatica                    |
| TanStack Query v5 | Gerenciamento de estado do servidor |
| wouter            | Roteamento client-side              |
| shadcn/ui         | Componentes de UI                   |
| Radix UI          | Primitivos de acessibilidade        |
| Tailwind CSS 3    | Estilizacao utilitaria              |
| Lucide React      | Icones                              |
| React Hook Form   | Gerenciamento de formularios        |
| Zod               | Validacao de schemas                |
| Framer Motion     | Animacoes                           |
| Recharts          | Graficos                            |

### Backend

| Tecnologia                          | Uso                              |
| ----------------------------------- | -------------------------------- |
| Express 5                           | Framework HTTP                   |
| TypeScript                          | Tipagem estatica                 |
| Drizzle ORM                         | ORM para PostgreSQL              |
| drizzle-zod                         | Validacao de schemas do banco    |
| Passport.js                         | Autenticacao                     |
| @clerk/express + @clerk/clerk-react | Autenticacao                     |
| connect-pg-simple                   | Sessoes em PostgreSQL            |
| OpenAI SDK                          | Cliente para OpenAI e OpenRouter |
| @google/generative-ai               | Cliente para Google Gemini       |
| Node.js crypto                      | Criptografia AES-256-CBC         |

### Banco de Dados

| Tecnologia        | Uso                                |
| ----------------- | ---------------------------------- |
| PostgreSQL (Neon) | Banco de dados relacional          |
| Drizzle Kit       | Migracao e sincronizacao de schema |

---

## Estrutura do Projeto

```
root/
├── client/
│   ├── index.html                    # HTML raiz
│   └── src/
│       ├── App.tsx                    # Componente raiz com roteamento e auth
│       ├── main.tsx                   # Entry point
│       ├── index.css                  # Estilos globais e variaveis CSS
│       ├── components/
│       │   ├── app-sidebar.tsx        # Sidebar com navegacao + seletor de perfil
│       │   ├── theme-toggle.tsx       # Alternador dark/light mode
│       │   └── ui/                    # Componentes shadcn/ui
│       ├── hooks/
│       │   ├── use-auth.ts            # Hook de autenticacao
│       │   ├── use-mobile.ts          # Deteccao de mobile
│       │   └── use-toast.ts           # Hook de notificacoes
│       ├── lib/
│       │   ├── queryClient.ts         # Configuracao do TanStack Query
│       │   └── utils.ts              # Utilitarios (cn, etc.)
│       └── pages/
│           ├── landing.tsx            # Pagina inicial (nao autenticado)
│           ├── stories.tsx            # Lista de historias
│           ├── story-detail.tsx       # Detalhe da historia + IA
│           ├── characters.tsx         # Gerenciamento de personagens + IA
│           ├── scripts.tsx            # Lista de roteiros
│           ├── script-detail.tsx      # Detalhe do roteiro + IA
│           ├── prompts.tsx            # Biblioteca de prompts
│           ├── executions.tsx         # Historico de execucoes IA
│           ├── profile.tsx            # Perfil e chaves de API
│           └── not-found.tsx          # Pagina 404
├── server/
│   ├── index.ts                       # Entry point do servidor
│   ├── routes.ts                      # Todas as rotas REST + logica IA
│   ├── storage.ts                     # Interface IStorage + DatabaseStorage
│   ├── crypto.ts                      # Encrypt/decrypt AES-256-CBC
│   ├── seed.ts                        # Dados iniciais realistas
│   └── auth/
│       └── index.ts                   # Auth Clerk + fallback local + rotas /api/auth/user
├── shared/
│   └── schema.ts                      # Schema Drizzle + Zod + tipos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
└── vite.config.ts
```

---

## Modelo de Dados

### Tabelas Principais

```
users                    stories                  characters
├── id (PK, serial)      ├── id (PK, serial)      ├── id (PK, serial)
├── username             ├── userId (FK → users)   ├── userId (FK → users)
├── password             ├── title                 ├── name
├── displayName          ├── premise               ├── description
├── externalAuthId       ├── tone                  ├── personality
├── openaiKey (enc.)     ├── status                ├── background
├── geminiKey (enc.)     ├── createdAt             ├── notes
└── openrouterKey (enc.) └── updatedAt             ├── active
                                                    ├── createdAt
                                                    └── updatedAt
```

```
scripts                  prompts                  creative_profiles
├── id (PK, serial)      ├── id (PK, serial)      ├── id (PK, serial)
├── storyId (FK)         ├── userId (FK)           ├── userId (FK)
├── title                ├── name                  ├── name
├── type                 ├── category              ├── model
├── content              ├── content               ├── temperature
├── origin               ├── type                  ├── maxTokens
├── createdAt            ├── version               ├── narrativeStyle
└── updatedAt            ├── active                ├── active
                         ├── createdAt             └── createdAt
                         └── updatedAt
```

```
ai_executions                   story_characters (junction)
├── id (PK, serial)             ├── id (PK, serial)
├── userId (FK)                 ├── storyId (FK → stories)
├── promptId (FK, opcional)     └── characterId (FK → characters)
├── storyId (FK, opcional)
├── scriptId (FK, opcional)
├── characterId (FK, opcional)
├── systemPromptSnapshot
├── userPrompt
├── finalPrompt
├── model
├── parameters (JSONB)
├── result
└── createdAt
```

```
auth_users                      sessions
├── id (PK, varchar UUID)       ├── sid (PK)
├── email                       ├── sess (JSON)
├── firstName                   └── expire
├── lastName
├── profileImageUrl
├── createdAt
└── updatedAt
```

### Relacionamentos

- **users** 1:N stories, characters, prompts, creative_profiles, ai_executions
- **stories** N:M characters (via story_characters)
- **stories** 1:N scripts
- **ai_executions** referencia opcional: prompt, story, script, character

---

## Autenticacao

O StoryForge utiliza **Clerk** quando as variaveis de ambiente do Clerk estao definidas.
Sem Clerk, entra automaticamente em modo local (usuario de desenvolvimento), o que facilita a execução local.

1. Em modo Clerk, o usuario acessa `/sign-in` ou `/sign-up`
2. O backend valida autenticacao e extrai `userId` do Clerk
3. A funcao `getOrCreateUserByExternalAuthId()` vincula/cria usuario na tabela `users`
4. Todas as rotas da API seguem protegidas por middleware `isAuthenticated`

---

## Integracao com IA

### Provedores Suportados

| Provedor                   | Configuracao                 | Modelos                             |
| -------------------------- | ---------------------------- | ----------------------------------- |
| **OpenAI** (chave própria) | Chave informada pelo usuário | Todos os modelos OpenAI             |
| **Google Gemini**          | Chave informada pelo usuario | Modelos Gemini 1.5 e 2.0            |
| **OpenRouter**             | Chave informada pelo usuario | 100+ modelos de diversos provedores |

### Fluxo de Geracao

1. Usuario abre o dialogo "Gerar com IA" em uma historia, roteiro ou personagem
2. Escreve um prompt descrevendo o que deseja
3. O sistema monta o prompt final com contexto (historia, personagens vinculados, etc.)
4. Envia para o provedor de IA configurado no perfil criativo ativo
5. Resultado e exibido inline no dialogo com:
   - Badge do modelo e temperatura usados
   - Prompt final enviado (com botao copiar)
   - Prompt de sistema
   - Resultado recebido (com botao copiar)
   - Aviso se o resultado retornou vazio
6. Toda a execucao e salva em `ai_executions` para auditoria

### Parametros de Geracao

Os parametros sao definidos pelo perfil criativo ativo:

- **Modelo**: qual modelo de IA usar
- **Temperatura**: controle de criatividade (0.0 = conservador, 2.0 = criativo) com fallback para 0.8
- **Tokens Maximos**: limite de tokens na resposta (padrao: 2048)
- **Estilo Narrativo**: instrucoes adicionais para o prompt de sistema

---

## Perfis Criativos

Perfis criativos permitem alternar rapidamente entre configuracoes de IA:

- Cada perfil define modelo, temperatura, tokens maximos e estilo narrativo
- Apenas um perfil pode estar ativo por vez
- O seletor de perfil na sidebar mostra o perfil ativo e permite trocar
- O modelo e temperatura ativos sao exibidos abaixo do seletor
- Ao gerar conteudo, os parametros do perfil ativo sao usados automaticamente

**Exemplo de perfis:**

- "Explorador Criativo" - modelo criativo, temperatura alta (0.9), prosa literaria
- "Redator Tecnico" - modelo preciso, temperatura baixa (0.3), linguagem objetiva
- "Brainstorm Rapido" - modelo rapido, temperatura media (0.7), ideias concisas

---

## Gerenciamento de Chaves de API

As chaves de API dos usuarios sao gerenciadas com seguranca:

- **Criptografia**: AES-256-CBC usando a variavel de ambiente `ENCRYPTION_KEY`
- **Armazenamento**: chaves criptografadas nas colunas `openaiKey`, `geminiKey`, `openrouterKey` da tabela `users`
- **Descriptografia**: apenas no momento do uso (chamada a IA), nunca expostas ao frontend
- **Interface**: pagina de perfil permite adicionar/atualizar/remover chaves
- **Prioridade**: chave do usuario > Replit AI Integrations (para OpenAI)

---

## Auditabilidade de Prompts

Cada execucao de IA registra:

| Campo                                  | Descricao                                         |
| -------------------------------------- | ------------------------------------------------- |
| `systemPromptSnapshot`                 | Copia do prompt de sistema no momento da execucao |
| `userPrompt`                           | Prompt original escrito pelo usuario              |
| `finalPrompt`                          | Prompt final montado com contexto                 |
| `model`                                | Modelo de IA utilizado                            |
| `parameters`                           | JSONB com temperatura, maxTokens, modelo          |
| `result`                               | Texto gerado pela IA                              |
| `storyId` / `scriptId` / `characterId` | Entidade associada (opcional)                     |
| `promptId`                             | Prompt da biblioteca usado (opcional)             |
| `createdAt`                            | Data/hora da execucao                             |

A pagina de "Execucoes" permite navegar por todo o historico de interacoes com IA.

---

## Rotas da API

### Autenticacao

| Metodo | Rota             | Descricao                           |
| ------ | ---------------- | ----------------------------------- |
| GET    | `/api/auth/user` | Retorna usuario autenticado         |
| GET    | `/api/login`     | Redireciona para login (`/sign-in`) |
| GET    | `/api/logout`    | Redireciona para logout/login       |

### Historias

| Metodo | Rota                                            | Descricao                          |
| ------ | ----------------------------------------------- | ---------------------------------- |
| GET    | `/api/stories`                                  | Lista historias do usuario         |
| GET    | `/api/stories/:id`                              | Detalhe com personagens e roteiros |
| POST   | `/api/stories`                                  | Cria historia                      |
| PATCH  | `/api/stories/:id`                              | Atualiza historia                  |
| DELETE | `/api/stories/:id`                              | Remove historia                    |
| POST   | `/api/stories/:id/characters`                   | Vincula personagem                 |
| DELETE | `/api/stories/:storyId/characters/:characterId` | Desvincula personagem              |

### Personagens

| Metodo | Rota                  | Descricao                    |
| ------ | --------------------- | ---------------------------- |
| GET    | `/api/characters`     | Lista personagens do usuario |
| POST   | `/api/characters`     | Cria personagem              |
| PATCH  | `/api/characters/:id` | Atualiza personagem          |
| DELETE | `/api/characters/:id` | Remove personagem            |

### Roteiros

| Metodo | Rota               | Descricao                 |
| ------ | ------------------ | ------------------------- |
| GET    | `/api/scripts`     | Lista roteiros do usuario |
| GET    | `/api/scripts/:id` | Detalhe do roteiro        |
| POST   | `/api/scripts`     | Cria roteiro              |
| PATCH  | `/api/scripts/:id` | Atualiza roteiro          |
| DELETE | `/api/scripts/:id` | Remove roteiro            |

### Prompts

| Metodo | Rota               | Descricao                              |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/api/prompts`     | Lista prompts do usuario               |
| POST   | `/api/prompts`     | Cria prompt (versionamento automatico) |
| PATCH  | `/api/prompts/:id` | Atualiza prompt                        |
| DELETE | `/api/prompts/:id` | Remove prompt                          |

### Perfis Criativos

| Metodo | Rota                         | Descricao               |
| ------ | ---------------------------- | ----------------------- |
| GET    | `/api/profiles`              | Lista perfis do usuario |
| POST   | `/api/profiles`              | Cria perfil             |
| PATCH  | `/api/profiles/:id`          | Atualiza perfil         |
| DELETE | `/api/profiles/:id`          | Remove perfil           |
| POST   | `/api/profiles/:id/activate` | Ativa perfil            |

### Administracao de Dados

| Metodo | Rota                | Descricao                                    |
| ------ | ------------------- | -------------------------------------------- |
| GET    | `/api/admin/export` | Exporta dados do usuario (sem chaves de API) |
| POST   | `/api/admin/import` | Importa dados e substitui estado atual       |

### Inteligencia Artificial

| Metodo | Rota                    | Descricao                   |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/ai/generate`      | Gera conteudo com IA        |
| POST   | `/api/ai/rerun`         | Re-executa geracao anterior |
| GET    | `/api/executions`       | Historico de execucoes      |
| GET    | `/api/models/:provider` | Lista modelos disponiveis   |

### Usuario

| Metodo | Rota             | Descricao                            |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/api/user/keys` | Salva chaves de API (criptografadas) |

---

## Tema e Design

### Cores

- **Primaria**: Roxo (HSL 262, 83%, 58%)
- Suporte completo a **dark mode** via classe CSS

### Tipografia

| Familia           | Uso                          |
| ----------------- | ---------------------------- |
| Plus Jakarta Sans | Texto geral (sans-serif)     |
| Libre Baskerville | Texto literario (serif)      |
| JetBrains Mono    | Codigo e prompts (monospace) |

### Componentes

- Baseado em **shadcn/ui** com primitivos Radix UI
- Sidebar colapsavel com navegacao e seletor de perfil
- Icones via **Lucide React**
- Notificacoes via toast
- Dialogos modais para geracao de IA

### Idioma

- Toda a interface em **portugues brasileiro (PT-BR)**

---

## Como Executar

### Pre-requisitos

- Node.js 20+
- PostgreSQL (ou Neon)

### Desenvolvimento

```bash
# Instalar dependencias
npm install

# Sincronizar schema do banco
npm run db:push

# Iniciar servidor de desenvolvimento (porta 5000)
npm run dev
```

### Producao

```bash
# Build dos assets
npm run build

# Iniciar servidor de producao
npm start
```

### Verificacao de tipos

```bash
npm run check
```

---

## Variaveis de Ambiente

| Variavel                     | Obrigatoria | Descricao                                             |
| ---------------------------- | ----------- | ----------------------------------------------------- |
| `DATABASE_URL`               | Sim         | URL de conexao PostgreSQL                             |
| `ENCRYPTION_KEY`             | Sim         | Chave para criptografia AES-256-CBC das chaves de API |
| `CLERK_SECRET_KEY`           | Nao         | Habilita autenticacao Clerk no backend                |
| `VITE_CLERK_PUBLISHABLE_KEY` | Nao         | Habilita telas de sign-in/sign-up no frontend         |
| `DEV_AUTH_USER_ID`           | Nao         | ID do usuario local (fallback sem Clerk)              |

| `PGHOST` | Auto | Host do PostgreSQL |
| `PGPORT` | Auto | Porta do PostgreSQL |
| `PGUSER` | Auto | Usuario do PostgreSQL |
| `PGPASSWORD` | Auto | Senha do PostgreSQL |
| `PGDATABASE` | Auto | Nome do banco PostgreSQL |

---

## Licenca

MIT
