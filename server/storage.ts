import {
  users, stories, characters, storyCharacters, scripts, prompts,
  creativeProfiles, aiExecutions,
  type User, type InsertUser,
  type Story, type InsertStory,
  type Character, type InsertCharacter,
  type StoryCharacter, type InsertStoryCharacter,
  type Script, type InsertScript,
  type Prompt, type InsertPrompt,
  type CreativeProfile, type InsertCreativeProfile,
  type AIExecution, type InsertAIExecution,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getStories(userId: number): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  createStory(data: InsertStory): Promise<Story>;
  updateStory(id: number, data: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: number): Promise<void>;

  getCharacters(userId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(data: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, data: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;

  getStoryCharacters(storyId: number): Promise<Character[]>;
  addStoryCharacter(data: InsertStoryCharacter): Promise<StoryCharacter>;
  removeStoryCharacter(storyId: number, characterId: number): Promise<void>;

  getScripts(userId?: number): Promise<Script[]>;
  getScriptsByStory(storyId: number): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  createScript(data: InsertScript): Promise<Script>;
  updateScript(id: number, data: Partial<InsertScript>): Promise<Script | undefined>;
  deleteScript(id: number): Promise<void>;

  getPrompts(userId: number): Promise<Prompt[]>;
  getPrompt(id: number): Promise<Prompt | undefined>;
  getActivePromptsByCategory(userId: number, category: string): Promise<Prompt[]>;
  createPrompt(data: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: number, data: Partial<InsertPrompt>): Promise<Prompt | undefined>;
  deletePrompt(id: number): Promise<void>;

  getProfiles(userId: number): Promise<CreativeProfile[]>;
  getActiveProfile(userId: number): Promise<CreativeProfile | undefined>;
  createProfile(data: InsertCreativeProfile): Promise<CreativeProfile>;
  updateProfile(id: number, data: Partial<InsertCreativeProfile>): Promise<CreativeProfile | undefined>;
  deleteProfile(id: number): Promise<void>;
  setActiveProfile(userId: number, profileId: number): Promise<void>;

  getExecutions(userId: number): Promise<AIExecution[]>;
  getExecution(id: number): Promise<AIExecution | undefined>;
  createExecution(data: InsertAIExecution): Promise<AIExecution>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getStories(userId: number): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.userId, userId)).orderBy(desc(stories.updatedAt));
  }

  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story || undefined;
  }

  async createStory(data: InsertStory): Promise<Story> {
    const [story] = await db.insert(stories).values(data).returning();
    return story;
  }

  async updateStory(id: number, data: Partial<InsertStory>): Promise<Story | undefined> {
    const [story] = await db.update(stories).set({ ...data, updatedAt: new Date() }).where(eq(stories.id, id)).returning();
    return story || undefined;
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  async getCharacters(userId: number): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.updatedAt));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [char] = await db.select().from(characters).where(eq(characters.id, id));
    return char || undefined;
  }

  async createCharacter(data: InsertCharacter): Promise<Character> {
    const [char] = await db.insert(characters).values(data).returning();
    return char;
  }

  async updateCharacter(id: number, data: Partial<InsertCharacter>): Promise<Character | undefined> {
    const [char] = await db.update(characters).set({ ...data, updatedAt: new Date() }).where(eq(characters.id, id)).returning();
    return char || undefined;
  }

  async deleteCharacter(id: number): Promise<void> {
    await db.delete(storyCharacters).where(eq(storyCharacters.characterId, id));
    await db.delete(characters).where(eq(characters.id, id));
  }

  async getStoryCharacters(storyId: number): Promise<Character[]> {
    const links = await db.select().from(storyCharacters).where(eq(storyCharacters.storyId, storyId));
    if (links.length === 0) return [];
    const charIds = links.map((l) => l.characterId);
    const result: Character[] = [];
    for (const cid of charIds) {
      const [char] = await db.select().from(characters).where(eq(characters.id, cid));
      if (char) result.push(char);
    }
    return result;
  }

  async addStoryCharacter(data: InsertStoryCharacter): Promise<StoryCharacter> {
    const [link] = await db.insert(storyCharacters).values(data).returning();
    return link;
  }

  async removeStoryCharacter(storyId: number, characterId: number): Promise<void> {
    await db.delete(storyCharacters)
      .where(and(eq(storyCharacters.storyId, storyId), eq(storyCharacters.characterId, characterId)));
  }

  async getScripts(userId?: number): Promise<Script[]> {
    return db.select().from(scripts).orderBy(desc(scripts.updatedAt));
  }

  async getScriptsByStory(storyId: number): Promise<Script[]> {
    return db.select().from(scripts).where(eq(scripts.storyId, storyId)).orderBy(desc(scripts.updatedAt));
  }

  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script || undefined;
  }

  async createScript(data: InsertScript): Promise<Script> {
    const [script] = await db.insert(scripts).values(data).returning();
    return script;
  }

  async updateScript(id: number, data: Partial<InsertScript>): Promise<Script | undefined> {
    const [script] = await db.update(scripts).set({ ...data, updatedAt: new Date() }).where(eq(scripts.id, id)).returning();
    return script || undefined;
  }

  async deleteScript(id: number): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  async getPrompts(userId: number): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.userId, userId)).orderBy(desc(prompts.updatedAt));
  }

  async getPrompt(id: number): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt || undefined;
  }

  async getActivePromptsByCategory(userId: number, category: string): Promise<Prompt[]> {
    return db.select().from(prompts)
      .where(and(eq(prompts.userId, userId), eq(prompts.category, category), eq(prompts.active, true)));
  }

  async createPrompt(data: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db.insert(prompts).values(data).returning();
    return prompt;
  }

  async updatePrompt(id: number, data: Partial<InsertPrompt>): Promise<Prompt | undefined> {
    const [prompt] = await db.update(prompts).set({ ...data, updatedAt: new Date() }).where(eq(prompts.id, id)).returning();
    return prompt || undefined;
  }

  async deletePrompt(id: number): Promise<void> {
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async getProfiles(userId: number): Promise<CreativeProfile[]> {
    return db.select().from(creativeProfiles).where(eq(creativeProfiles.userId, userId)).orderBy(desc(creativeProfiles.createdAt));
  }

  async getActiveProfile(userId: number): Promise<CreativeProfile | undefined> {
    const [profile] = await db.select().from(creativeProfiles)
      .where(and(eq(creativeProfiles.userId, userId), eq(creativeProfiles.active, true)));
    return profile || undefined;
  }

  async createProfile(data: InsertCreativeProfile): Promise<CreativeProfile> {
    const [profile] = await db.insert(creativeProfiles).values(data).returning();
    return profile;
  }

  async updateProfile(id: number, data: Partial<InsertCreativeProfile>): Promise<CreativeProfile | undefined> {
    const [profile] = await db.update(creativeProfiles).set(data).where(eq(creativeProfiles.id, id)).returning();
    return profile || undefined;
  }

  async deleteProfile(id: number): Promise<void> {
    await db.delete(creativeProfiles).where(eq(creativeProfiles.id, id));
  }

  async setActiveProfile(userId: number, profileId: number): Promise<void> {
    await db.update(creativeProfiles)
      .set({ active: false })
      .where(eq(creativeProfiles.userId, userId));
    await db.update(creativeProfiles)
      .set({ active: true })
      .where(eq(creativeProfiles.id, profileId));
  }

  async getExecutions(userId: number): Promise<AIExecution[]> {
    return db.select().from(aiExecutions).where(eq(aiExecutions.userId, userId)).orderBy(desc(aiExecutions.createdAt));
  }

  async getExecution(id: number): Promise<AIExecution | undefined> {
    const [exec] = await db.select().from(aiExecutions).where(eq(aiExecutions.id, id));
    return exec || undefined;
  }

  async createExecution(data: InsertAIExecution): Promise<AIExecution> {
    const [exec] = await db.insert(aiExecutions).values(data).returning();
    return exec;
  }
}

export const storage = new DatabaseStorage();
