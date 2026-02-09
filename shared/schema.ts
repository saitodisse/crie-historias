import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  authProvider: text("auth_provider").default("legacy"),
  externalAuthId: varchar("external_auth_id").unique(),
  openaiKey: text("openai_key"),
  geminiKey: text("gemini_key"),
  openrouterKey: text("openrouter_key"),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  characters: many(characters),
  prompts: many(prompts),
  creativeProfiles: many(creativeProfiles),
  aiExecutions: many(aiExecutions),
}));

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  premise: text("premise"),
  tone: text("tone"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  scripts: many(scripts),
  projectCharacters: many(projectCharacters),
  aiExecutions: many(aiExecutions),
}));

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  personality: text("personality"),
  background: text("background"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  projectCharacters: many(projectCharacters),
  aiExecutions: many(aiExecutions),
}));

export const projectCharacters = pgTable("project_characters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
});

export const projectCharactersRelations = relations(
  projectCharacters,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCharacters.projectId],
      references: [projects.id],
    }),
    character: one(characters, {
      fields: [projectCharacters.characterId],
      references: [characters.id],
    }),
  })
);

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("synopsis"),
  content: text("content"),
  origin: text("origin").notNull().default("manual"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  project: one(projects, {
    fields: [scripts.projectId],
    references: [projects.id],
  }),
  aiExecutions: many(aiExecutions),
}));

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("task"),
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
  aiExecutions: many(aiExecutions),
}));

export const creativeProfiles = pgTable("creative_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  model: text("model").notNull().default("gpt-5-mini"),
  temperature: text("temperature").notNull().default("0.8"),
  maxTokens: integer("max_tokens").notNull().default(2048),
  narrativeStyle: text("narrative_style"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const creativeProfilesRelations = relations(
  creativeProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [creativeProfiles.userId],
      references: [users.id],
    }),
  })
);

export const aiExecutions = pgTable("ai_executions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  projectId: integer("project_id").references(() => projects.id),
  scriptId: integer("script_id").references(() => scripts.id),
  characterId: integer("character_id").references(() => characters.id),
  systemPromptSnapshot: text("system_prompt_snapshot"),
  userPrompt: text("user_prompt").notNull(),
  finalPrompt: text("final_prompt").notNull(),
  model: text("model").notNull(),
  parameters: jsonb("parameters"),
  result: text("result"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const aiExecutionsRelations = relations(aiExecutions, ({ one }) => ({
  user: one(users, { fields: [aiExecutions.userId], references: [users.id] }),
  prompt: one(prompts, {
    fields: [aiExecutions.promptId],
    references: [prompts.id],
  }),
  project: one(projects, {
    fields: [aiExecutions.projectId],
    references: [projects.id],
  }),
  script: one(scripts, {
    fields: [aiExecutions.scriptId],
    references: [scripts.id],
  }),
  character: one(characters, {
    fields: [aiExecutions.characterId],
    references: [characters.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProjectCharacterSchema = createInsertSchema(
  projectCharacters
).omit({ id: true });
export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCreativeProfileSchema = createInsertSchema(
  creativeProfiles
).omit({ id: true, createdAt: true });
export const insertAiExecutionSchema = createInsertSchema(aiExecutions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type ProjectCharacter = typeof projectCharacters.$inferSelect;
export type InsertProjectCharacter = z.infer<
  typeof insertProjectCharacterSchema
>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type CreativeProfile = typeof creativeProfiles.$inferSelect;
export type InsertCreativeProfile = z.infer<typeof insertCreativeProfileSchema>;
export type AIExecution = typeof aiExecutions.$inferSelect;
export type InsertAIExecution = z.infer<typeof insertAiExecutionSchema>;
