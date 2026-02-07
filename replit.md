# StoryForge - Creative Writing Studio

## Overview

AI-powered creative writing platform for managing stories, characters, and scripts with full prompt auditability. Uses OpenAI via Replit AI Integrations (no API key needed, charges billed to credits). Supports OpenAI, Gemini, and OpenRouter with user-managed API keys (AES-256-CBC encrypted).

## Architecture

- **Frontend**: React + Vite + TanStack Query + wouter routing + shadcn/ui + Tailwind CSS
- **Backend**: Express.js API with TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations + user-provided keys for OpenAI/Gemini/OpenRouter
- **Auth**: Replit Auth (OIDC via openid-client + passport)

## Authentication

- Replit OIDC auth with passport strategy, sessions stored in PostgreSQL (sessions table)
- Two user tables: `auth_users` (varchar UUID from Replit, stores OIDC claims) and `users` (serial integer, app data)
- Link between tables via `users.replit_id` column (unique, references auth_users.id)
- `getOrCreateUserByReplitId()` auto-creates app user on first authenticated request
- All API routes protected with `isAuthenticated` middleware
- Landing page shown for unauthenticated users, full app for authenticated

## Key Design Decisions

- Full prompt auditability: every AI execution stores system prompt snapshot, user prompt, final assembled prompt, model parameters, and results
- Creative profiles store AI model preferences (model, temperature, maxTokens, narrativeStyle) with one active profile per user
- Prompt versioning: version increments when content changes
- Story-Character many-to-many via junction table (characters reusable across stories)
- Scripts belong to stories, can be manual or AI-generated
- User API keys encrypted with AES-256-CBC using ENCRYPTION_KEY secret

## Database Schema (10+ tables)

- auth_users (OIDC user data), sessions (session store)
- users, stories, characters, story_characters (junction), scripts, prompts, creative_profiles, ai_executions
- Plus conversation/message tables from AI integration

## Project Structure

- `shared/schema.ts` - Drizzle schema + Zod insert schemas + types
- `shared/models/auth.ts` - Auth users table schema
- `server/storage.ts` - IStorage interface + DatabaseStorage implementation
- `server/routes.ts` - All API endpoints + AI integration (OpenAI/Gemini/OpenRouter)
- `server/crypto.ts` - AES-256-CBC encrypt/decrypt for API keys
- `server/seed.ts` - Realistic seed data
- `server/replit_integrations/auth/` - Replit Auth setup (replitAuth.ts, storage.ts, routes.ts)
- `client/src/App.tsx` - Root with auth-gated layout (landing vs app)
- `client/src/hooks/use-auth.ts` - Auth hook (user, isAuthenticated, logout)
- `client/src/pages/landing.tsx` - Landing page for unauthenticated users
- `client/src/pages/` - stories, story-detail, characters, scripts, script-detail, prompts, executions, profile
- `client/src/components/` - app-sidebar (with user info + logout), theme-toggle

## Theme

- Primary: Purple (262, 83%, 58%)
- Fonts: Plus Jakarta Sans (sans), Libre Baskerville (serif), JetBrains Mono (mono)
- Dark mode support via ThemeProvider
- UI language: Portuguese (PT-BR)

## Running

- `npm run dev` starts Express + Vite on port 5000
- `npm run db:push` syncs schema to database
