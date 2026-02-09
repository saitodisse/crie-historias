import {
  users,
  projects,
  characters,
  projectCharacters,
  scripts,
  prompts,
  creativeProfiles,
  aiExecutions,
  scriptPrompts,
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
import { eq, desc, and, sql } from "drizzle-orm";

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
  getPromptsByIds(ids: number[]): Promise<Prompt[]>;

  getScriptPrompts(scriptId: number): Promise<number[]>;
  updateScriptPrompts(scriptId: number, promptIds: number[]): Promise<void>;

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

  exportData(): Promise<any>;
  importData(data: any): Promise<void>;
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
    await db.delete(scriptPrompts).where(eq(scriptPrompts.scriptId, id));
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  async getScriptPrompts(scriptId: number): Promise<number[]> {
    const results = await db
      .select()
      .from(scriptPrompts)
      .where(eq(scriptPrompts.scriptId, scriptId));
    return results.map((r) => r.promptId);
  }

  async updateScriptPrompts(
    scriptId: number,
    promptIds: number[]
  ): Promise<void> {
    // Basic sync: delete and re-insert
    await db.delete(scriptPrompts).where(eq(scriptPrompts.scriptId, scriptId));
    if (promptIds.length > 0) {
      await db.insert(scriptPrompts).values(
        promptIds.map((pid) => ({
          scriptId,
          promptId: pid,
        }))
      );
    }
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
    await db.delete(scriptPrompts).where(eq(scriptPrompts.promptId, id));
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async getPromptsByIds(ids: number[]): Promise<Prompt[]> {
    if (ids.length === 0) return [];
    // Using simple loop or inArray if available. Since it's a small list, loop is safe.
    const results: Prompt[] = [];
    for (const id of ids) {
      const p = await this.getPrompt(id);
      if (p) results.push(p);
    }
    return results;
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

  async exportData(): Promise<any> {
    const defaultUser = await db.query.users.findFirst({
        orderBy: (users, { asc }) => [asc(users.id)],
    });

    // If no user exists, we can still export empty arrays
    // But realistically the app needs a user to function.
    
    // We export everything raw
    const [
      allUsers,
      allProjects,
      allCharacters,
      allProjectCharacters,
      allScripts,
      allPrompts,
      allScriptPrompts,
      allCreativeProfiles,
      allAiExecutions,
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(projects),
      db.select().from(characters),
      db.select().from(projectCharacters),
      db.select().from(scripts),
      db.select().from(prompts),
      db.select().from(scriptPrompts),
      db.select().from(creativeProfiles),
      db.select().from(aiExecutions),
    ]);

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        users: allUsers.map(u => ({
          ...u,
          password: "redacted",
          openaiKey: null,
          geminiKey: null,
          openrouterKey: null,
        })),
        projects: allProjects,
        characters: allCharacters,
        projectCharacters: allProjectCharacters,
        scripts: allScripts,
        prompts: allPrompts,
        scriptPrompts: allScriptPrompts,
        creativeProfiles: allCreativeProfiles,
        aiExecutions: allAiExecutions,
      },
    };
  }

  async importData(importPayload: any): Promise<void> {
    const { data } = importPayload;
    
    // Simple validation
    if (!data || !data.users) {
        throw new Error("Invalid import data format");
    }

    // Capture existing keys to preserve them if needed
    // We match by externalAuthId or username
    const existingUsers = await db.select({
      externalAuthId: users.externalAuthId,
      username: users.username,
      openaiKey: users.openaiKey,
      geminiKey: users.geminiKey,
      openrouterKey: users.openrouterKey,
      password: users.password,
    }).from(users);

    await db.transaction(async (tx) => {
      // 1. Delete all existing data in correct order to avoid FK constraints
      await tx.delete(aiExecutions);
      await tx.delete(scriptPrompts);
      await tx.delete(projectCharacters);
      await tx.delete(scripts);
      await tx.delete(projects);
      await tx.delete(characters);
      await tx.delete(prompts);
      await tx.delete(creativeProfiles);
      await tx.delete(users);

      // 2. Insert new data in correct order
      // We sanitize users from the import payload to ensure no keys/passwords are imported
      const sanitizedUsers = data.users.map((u: any) => {
        // Find if this user existed before and has keys to preserve
        const existing = existingUsers.find(ex => 
          (u.externalAuthId && ex.externalAuthId === u.externalAuthId) || 
          (ex.username === u.username)
        );

        return {
          ...u,
          // ALWAYS ignore keys and password from import payload
          password: existing?.password || "redacted",
          openaiKey: existing?.openaiKey || null,
          geminiKey: existing?.geminiKey || null,
          openrouterKey: existing?.openrouterKey || null,
        };
      });
      
      if (sanitizedUsers.length > 0) await tx.insert(users).values(sanitizedUsers);
      if (data.projects.length > 0) await tx.insert(projects).values(data.projects);
      if (data.characters.length > 0) await tx.insert(characters).values(data.characters);
      if (data.prompts.length > 0) await tx.insert(prompts).values(data.prompts);
      if (data.creativeProfiles.length > 0) await tx.insert(creativeProfiles).values(data.creativeProfiles);
      
      if (data.scripts.length > 0) await tx.insert(scripts).values(data.scripts);
      
      if (data.projectCharacters.length > 0) await tx.insert(projectCharacters).values(data.projectCharacters);
      if (data.scriptPrompts.length > 0) await tx.insert(scriptPrompts).values(data.scriptPrompts);
      
      if (data.aiExecutions.length > 0) await tx.insert(aiExecutions).values(data.aiExecutions);

      // 3. Reset sequences
      const tables = [
        "users",
        "projects",
        "characters",
        "scripts",
        "prompts",
        "creative_profiles",
        "ai_executions",
        "project_characters",
        "script_prompts",
      ];

      for (const table of tables) {
         await tx.execute(sql.raw(`SELECT setval('${table}_id_seq', (SELECT MAX(id) FROM ${table}));`));
      }
    });
  }
}

export const storage = new DatabaseStorage();
