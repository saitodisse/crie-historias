# Crie Histórias - Gemini CLI Context

This document provides a summary of the "Crie Histórias" project, intended for use as instructional context for the Gemini CLI.

## Project Overview

"Crie Histórias" (Create Stories) is a comprehensive creative writing platform assisted by artificial intelligence, designed for managing stories, characters, and scripts. It features complete observability of AI calls and a user interface in Brazilian Portuguese (PT-BR).

**Key Features:**

- **Story Management:** Create, edit, and delete stories with title, premise, tone, and status. Link existing characters to stories.
- **Character Management:** Create reusable characters with detailed descriptions, personality, and background. AI-assisted character description generation.
- **Scripts:** Create story-linked scripts (synopsis, outline, detailed), with manual or AI-generated content.
- **Prompt Library:** Save and version prompts for reuse, with categories and types.
- **AI Content Generation:** Supports OpenAI, Google Gemini, and OpenRouter. Provides full observability of sent prompts, system prompts, parameters, and results for each generation.
- **Creative Profiles:** Configure AI model preferences (model, temperature, max tokens, narrative style) per profile, with an active profile selector.
- **Execution History:** Comprehensive audit trail of all AI calls, storing prompts, models, parameters, and results.
- **User Profile:** API key configuration (encrypted) for OpenAI, Gemini, and OpenRouter, and creative profile management.

**Architecture:**
The application follows a client-server architecture:

- **Client (Frontend):** Built with React + Vite, using TanStack Query for data fetching, wouter for routing, and `shadcn/ui` with Tailwind CSS for UI components and styling.
- **Server (Backend):** Developed with Express.js + TypeScript, handling REST API routes, Authentication (Clerk + Local Fallback), Drizzle ORM for database interactions, and integration with various AI providers (OpenAI, Gemini, OpenRouter).
- **Database:** PostgreSQL (Neon) is used for data persistence.

The frontend and backend run on the same Express server on port 5000. In development, Vite serves the frontend with HMR; in production, assets are pre-compiled and served statically.

## Technological Stack

### Frontend

- **React 18:** UI library
- **Vite 7:** Build tool and dev server
- **TypeScript:** Static typing
- **TanStack Query v5:** Server state management
- **wouter:** Client-side routing
- **shadcn/ui & Radix UI:** UI components and accessibility primitives
- **Tailwind CSS 3:** Utility-first styling
- **Lucide React:** Icons
- **React Hook Form & Zod:** Form management and schema validation
- **Framer Motion:** Animations

### Backend

- **Express 5:** HTTP framework
- **TypeScript:** Static typing
- **Drizzle ORM & drizzle-zod:** ORM for PostgreSQL and schema validation
- **Clerk & Local Auth:** Hybrid authentication (Cloud or Local)
- **connect-pg-simple:** PostgreSQL sessions
- **OpenAI SDK & @google/generative-ai:** AI provider clients
- **Node.js crypto:** AES-256-CBC encryption

### Database

- **PostgreSQL (Neon):** Relational database
- **Drizzle Kit:** Schema migration and synchronization

## Building and Running

### Prerequisites

- Node.js 20+
- PostgreSQL (or Neon)

### Development

To set up and run the project in development mode:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Synchronize database schema:**
    ```bash
    npm run db:push
    ```
3.  **Start development server (on port 5000):**
    ```bash
    npm run dev
    ```

### Production

To build and run the project in production mode:

1.  **Build assets:**
    ```bash
    npm run build
    ```
2.  **Start production server:**
    ```bash
    npm start
    ```

### Type Checking

To perform type verification:

```bash
npm run check
```

## Development Conventions

- **Language:** The entire interface is in Brazilian Portuguese (PT-BR).
- **Styling:** Utilizes Tailwind CSS for utility-first styling and `shadcn/ui` components built on Radix UI primitives. Full dark mode support.
- **Code Structure:** Follows a clear client/server separation, with shared schemas and models.
- **Typing:** Strongly typed using TypeScript across both frontend and backend.
- **Authentication:** Leverages Clerk (Cloud) or Local Fallback (Development), with user sessions stored in PostgreSQL.
- **API Keys:** User-provided API keys are encrypted using AES-256-CBC and decrypted only at the point of use.
- **Database:** Uses Drizzle ORM for type-safe database interactions and schema management.
