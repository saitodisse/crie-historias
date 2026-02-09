import {
  users,
  projects,
  characters,
  projectCharacters,
  scripts,
  prompts,
  creativeProfiles,
  aiExecutions,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Character,
  type InsertCharacter,
  type ProjectCharacter,
  type InsertProjectCharacter,
  type Script,
  type InsertScript,
  type Prompt,
  type InsertPrompt,
  type CreativeProfile,
  type InsertCreativeProfile,
  type AIExecution,
  type InsertAIExecution,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByExternalAuthId(externalAuthId: string): Promise<User | undefined>;
  getOrCreateUserByExternalAuthId(
    externalAuthId: string,
    provider: string,
    displayName?: string
  ): Promise<User>;
  createUser(user: InsertUser): Promise<User>;

  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(
    id: number,
    data: Partial<InsertProject>
  ): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  getCharacters(userId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(data: InsertCharacter): Promise<Character>;
  updateCharacter(
    id: number,
    data: Partial<InsertCharacter>
  ): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;

  getProjectCharacters(projectId: number): Promise<Character[]>;
  addProjectCharacter(data: InsertProjectCharacter): Promise<ProjectCharacter>;
  removeProjectCharacter(projectId: number, characterId: number): Promise<void>;

  getScripts(userId?: number): Promise<Script[]>;
  getScriptsByProject(projectId: number): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  createScript(data: InsertScript): Promise<Script>;
  updateScript(
    id: number,
    data: Partial<InsertScript>
  ): Promise<Script | undefined>;
  deleteScript(id: number): Promise<void>;

  getPrompts(userId: number): Promise<Prompt[]>;
  getPrompt(id: number): Promise<Prompt | undefined>;
  getActivePromptsByCategory(
    userId: number,
    category: string
  ): Promise<Prompt[]>;
  createPrompt(data: InsertPrompt): Promise<Prompt>;
  updatePrompt(
    id: number,
    data: Partial<InsertPrompt>
  ): Promise<Prompt | undefined>;
  deletePrompt(id: number): Promise<void>;

  getProfiles(userId: number): Promise<CreativeProfile[]>;
  getActiveProfile(userId: number): Promise<CreativeProfile | undefined>;
  createProfile(data: InsertCreativeProfile): Promise<CreativeProfile>;
  updateProfile(
    id: number,
    data: Partial<InsertCreativeProfile>
  ): Promise<CreativeProfile | undefined>;
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
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByExternalAuthId(
    externalAuthId: string
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalAuthId, externalAuthId));
    return user || undefined;
  }

  async getOrCreateUserByExternalAuthId(
    externalAuthId: string,
    provider: string,
    displayName?: string
  ): Promise<User> {
    let user = await this.getUserByExternalAuthId(externalAuthId);
    if (!user) {
      const username = `user_${externalAuthId.substring(0, 16).replace(/[^a-zA-Z0-9_]/g, "_")}`;
      [user] = await db
        .insert(users)
        .values({
          username,
          password: `${provider}-auth`,
          displayName: displayName || username,
          externalAuthId,
          authProvider: provider,
        })
        .returning();
    }
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getProjects(userId: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(
    id: number,
    data: Partial<InsertProject>
  ): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getCharacters(userId: number): Promise<Character[]> {
    return db
      .select()
      .from(characters)
      .where(eq(characters.userId, userId))
      .orderBy(desc(characters.updatedAt));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, id));
    return char || undefined;
  }

  async createCharacter(data: InsertCharacter): Promise<Character> {
    const [char] = await db.insert(characters).values(data).returning();
    return char;
  }

  async updateCharacter(
    id: number,
    data: Partial<InsertCharacter>
  ): Promise<Character | undefined> {
    const [char] = await db
      .update(characters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return char || undefined;
  }

  async deleteCharacter(id: number): Promise<void> {
    await db
      .delete(projectCharacters)
      .where(eq(projectCharacters.characterId, id));
    await db.delete(characters).where(eq(characters.id, id));
  }

  async getProjectCharacters(projectId: number): Promise<Character[]> {
    const links = await db
      .select()
      .from(projectCharacters)
      .where(eq(projectCharacters.projectId, projectId));
    if (links.length === 0) return [];
    const charIds = links.map((l) => l.characterId);
    const result: Character[] = [];
    for (const cid of charIds) {
      const [char] = await db
        .select()
        .from(characters)
        .where(eq(characters.id, cid));
      if (char) result.push(char);
    }
    return result;
  }

  async addProjectCharacter(
    data: InsertProjectCharacter
  ): Promise<ProjectCharacter> {
    const [link] = await db.insert(projectCharacters).values(data).returning();
    return link;
  }

  async removeProjectCharacter(
    projectId: number,
    characterId: number
  ): Promise<void> {
    await db
      .delete(projectCharacters)
      .where(
        and(
          eq(projectCharacters.projectId, projectId),
          eq(projectCharacters.characterId, characterId)
        )
      );
  }

  async getScripts(userId?: number): Promise<Script[]> {
    return db.select().from(scripts).orderBy(desc(scripts.updatedAt));
  }

  async getScriptsByProject(projectId: number): Promise<Script[]> {
    return db
      .select()
      .from(scripts)
      .where(eq(scripts.projectId, projectId))
      .orderBy(desc(scripts.updatedAt));
  }

  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script || undefined;
  }

  async createScript(data: InsertScript): Promise<Script> {
    const [script] = await db.insert(scripts).values(data).returning();
    return script;
  }

  async updateScript(
    id: number,
    data: Partial<InsertScript>
  ): Promise<Script | undefined> {
    const [script] = await db
      .update(scripts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scripts.id, id))
      .returning();
    return script || undefined;
  }

  async deleteScript(id: number): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  async getPrompts(userId: number): Promise<Prompt[]> {
    return db
      .select()
      .from(prompts)
      .where(eq(prompts.userId, userId))
      .orderBy(desc(prompts.updatedAt));
  }

  async getPrompt(id: number): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt || undefined;
  }

  async getActivePromptsByCategory(
    userId: number,
    category: string
  ): Promise<Prompt[]> {
    return db
      .select()
      .from(prompts)
      .where(
        and(
          eq(prompts.userId, userId),
          eq(prompts.category, category),
          eq(prompts.active, true)
        )
      );
  }

  async createPrompt(data: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db.insert(prompts).values(data).returning();
    return prompt;
  }

  async updatePrompt(
    id: number,
    data: Partial<InsertPrompt>
  ): Promise<Prompt | undefined> {
    const [prompt] = await db
      .update(prompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prompts.id, id))
      .returning();
    return prompt || undefined;
  }

  async deletePrompt(id: number): Promise<void> {
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async getProfiles(userId: number): Promise<CreativeProfile[]> {
    return db
      .select()
      .from(creativeProfiles)
      .where(eq(creativeProfiles.userId, userId))
      .orderBy(desc(creativeProfiles.createdAt));
  }

  async getActiveProfile(userId: number): Promise<CreativeProfile | undefined> {
    const [profile] = await db
      .select()
      .from(creativeProfiles)
      .where(
        and(
          eq(creativeProfiles.userId, userId),
          eq(creativeProfiles.active, true)
        )
      )
      .orderBy(desc(creativeProfiles.createdAt));
    return profile || undefined;
  }

  async createProfile(data: InsertCreativeProfile): Promise<CreativeProfile> {
    if (data.active) {
      // Ensure only one profile is active at a time
      await db
        .update(creativeProfiles)
        .set({ active: false })
        .where(eq(creativeProfiles.userId, data.userId));
    }
    const [profile] = await db
      .insert(creativeProfiles)
      .values(data)
      .returning();
    return profile;
  }

  async updateProfile(
    id: number,
    data: Partial<InsertCreativeProfile>
  ): Promise<CreativeProfile | undefined> {
    if (data.active) {
      // Get the user ID first to deactivate other profiles
      const [existing] = await db
        .select()
        .from(creativeProfiles)
        .where(eq(creativeProfiles.id, id));

      if (existing) {
        await db
          .update(creativeProfiles)
          .set({ active: false })
          .where(eq(creativeProfiles.userId, existing.userId));
      }
    }
    const [profile] = await db
      .update(creativeProfiles)
      .set(data)
      .where(eq(creativeProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  async deleteProfile(id: number): Promise<void> {
    await db.delete(creativeProfiles).where(eq(creativeProfiles.id, id));
  }

  async setActiveProfile(userId: number, profileId: number): Promise<void> {
    await db
      .update(creativeProfiles)
      .set({ active: false })
      .where(eq(creativeProfiles.userId, userId));
    await db
      .update(creativeProfiles)
      .set({ active: true })
      .where(eq(creativeProfiles.id, profileId));
  }

  async getExecutions(userId: number): Promise<AIExecution[]> {
    return db
      .select()
      .from(aiExecutions)
      .where(eq(aiExecutions.userId, userId))
      .orderBy(desc(aiExecutions.createdAt));
  }

  async getExecution(id: number): Promise<AIExecution | undefined> {
    const [exec] = await db
      .select()
      .from(aiExecutions)
      .where(eq(aiExecutions.id, id));
    return exec || undefined;
  }

  async createExecution(data: InsertAIExecution): Promise<AIExecution> {
    const [exec] = await db.insert(aiExecutions).values(data).returning();
    return exec;
  }
}

export const storage = new DatabaseStorage();
