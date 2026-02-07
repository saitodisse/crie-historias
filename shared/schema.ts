import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
});

export const usersRelations = relations(users, ({ many }) => ({
  stories: many(stories),
  characters: many(characters),
  prompts: many(prompts),
  creativeProfiles: many(creativeProfiles),
  aiExecutions: many(aiExecutions),
}));

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  premise: text("premise"),
  tone: text("tone"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
  scripts: many(scripts),
  storyCharacters: many(storyCharacters),
  aiExecutions: many(aiExecutions),
}));

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  personality: text("personality"),
  background: text("background"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  storyCharacters: many(storyCharacters),
  aiExecutions: many(aiExecutions),
}));

export const storyCharacters = pgTable("story_characters", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
});

export const storyCharactersRelations = relations(storyCharacters, ({ one }) => ({
  story: one(stories, { fields: [storyCharacters.storyId], references: [stories.id] }),
  character: one(characters, { fields: [storyCharacters.characterId], references: [characters.id] }),
}));

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("synopsis"),
  content: text("content"),
  origin: text("origin").notNull().default("manual"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  story: one(stories, { fields: [scripts.storyId], references: [stories.id] }),
  aiExecutions: many(aiExecutions),
}));

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("task"),
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
  aiExecutions: many(aiExecutions),
}));

export const creativeProfiles = pgTable("creative_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  model: text("model").notNull().default("gpt-5-mini"),
  temperature: text("temperature").notNull().default("0.8"),
  maxTokens: integer("max_tokens").notNull().default(2048),
  narrativeStyle: text("narrative_style"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creativeProfilesRelations = relations(creativeProfiles, ({ one }) => ({
  user: one(users, { fields: [creativeProfiles.userId], references: [users.id] }),
}));

export const aiExecutions = pgTable("ai_executions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  storyId: integer("story_id").references(() => stories.id),
  scriptId: integer("script_id").references(() => scripts.id),
  characterId: integer("character_id").references(() => characters.id),
  systemPromptSnapshot: text("system_prompt_snapshot"),
  userPrompt: text("user_prompt").notNull(),
  finalPrompt: text("final_prompt").notNull(),
  model: text("model").notNull(),
  parameters: jsonb("parameters"),
  result: text("result"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiExecutionsRelations = relations(aiExecutions, ({ one }) => ({
  user: one(users, { fields: [aiExecutions.userId], references: [users.id] }),
  prompt: one(prompts, { fields: [aiExecutions.promptId], references: [prompts.id] }),
  story: one(stories, { fields: [aiExecutions.storyId], references: [stories.id] }),
  script: one(scripts, { fields: [aiExecutions.scriptId], references: [scripts.id] }),
  character: one(characters, { fields: [aiExecutions.characterId], references: [characters.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStoryCharacterSchema = createInsertSchema(storyCharacters).omit({ id: true });
export const insertScriptSchema = createInsertSchema(scripts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreativeProfileSchema = createInsertSchema(creativeProfiles).omit({ id: true, createdAt: true });
export const insertAiExecutionSchema = createInsertSchema(aiExecutions).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type StoryCharacter = typeof storyCharacters.$inferSelect;
export type InsertStoryCharacter = z.infer<typeof insertStoryCharacterSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type CreativeProfile = typeof creativeProfiles.$inferSelect;
export type InsertCreativeProfile = z.infer<typeof insertCreativeProfileSchema>;
export type AIExecution = typeof aiExecutions.$inferSelect;
export type InsertAIExecution = z.infer<typeof insertAiExecutionSchema>;
