# StoryForge - Creative Writing Studio

## Overview
AI-powered creative writing platform for managing stories, characters, and scripts with full prompt auditability. Uses OpenAI via Replit AI Integrations (no API key needed, charges billed to credits).

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter routing + shadcn/ui + Tailwind CSS
- **Backend**: Express.js API with TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (javascript_openai_ai_integrations)
- **Mode**: Single-user MVP (DEFAULT_USER_ID = 1, no auth)

## Key Design Decisions
- Full prompt auditability: every AI execution stores system prompt snapshot, user prompt, final assembled prompt, model parameters, and results
- Creative profiles store AI model preferences (model, temperature, maxTokens, narrativeStyle) with one active profile per user
- Prompt versioning: version increments when content changes
- Story-Character many-to-many via junction table (characters reusable across stories)
- Scripts belong to stories, can be manual or AI-generated

## Database Schema (8+ tables)
- users, stories, characters, story_characters (junction), scripts, prompts, creative_profiles, ai_executions
- Plus conversation/message tables from AI integration

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod insert schemas + types
- `server/storage.ts` - IStorage interface + DatabaseStorage implementation
- `server/routes.ts` - All API endpoints + OpenAI integration
- `server/seed.ts` - Realistic seed data (3 stories, 3 characters, 4 prompts, 2 profiles, scripts)
- `client/src/App.tsx` - Root with sidebar layout + all routes
- `client/src/pages/` - stories, story-detail, characters, scripts, script-detail, prompts, executions, profile
- `client/src/components/` - app-sidebar, theme-toggle

## Theme
- Primary: Purple (262, 83%, 58%)
- Fonts: Plus Jakarta Sans (sans), Libre Baskerville (serif), JetBrains Mono (mono)
- Dark mode support via ThemeProvider

## Running
- `npm run dev` starts Express + Vite on port 5000
- `npm run db:push` syncs schema to database
