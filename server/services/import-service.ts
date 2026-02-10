import { db } from "../db";
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
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

interface ImportData {
  projects?: any[];
  characters?: any[];
  projectCharacters?: any[];
  scripts?: any[];
  prompts?: any[];
  scriptPrompts?: any[];
  creativeProfiles?: any[];
  aiExecutions?: any[];
}

function fixDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => fixDates(item));
  }

  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string") {
        // Check if it looks like an ISO date
        if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            obj[key] = d;
          }
        }
      } else if (typeof val === "object") {
        obj[key] = fixDates(val);
      }
    }
  }
  return obj;
}

/**
 * Smartly imports data for a specific user efficiently replacing their existing content.
 * Remaps IDs to ensure safety and integrity.
 */
export async function importDataForUser(userId: number, data: ImportData) {
  // Ensure all date strings are converted to Date objects for Drizzle
  fixDates(data);

  await db.transaction(async (tx) => {
    // 1. DELETE EXISTING DATA FOR THIS USER
    // Order matters for Foreign Key constraints

    // Get user projects to identify related scripts/links
    const userProjects = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, userId));
    const userProjectIds = userProjects.map((p) => p.id);

    // Get user scripts to identify related script_prompts
    // Scripts are linked to projects. If we delete projects, we delete scripts.
    // But we need to find them first if we want to be explicit or if we need to delete children manually.
    // Assuming cascade delete is NOT enabled at DB level (safest assumption), we must delete manually.

    let userScriptIds: number[] = [];
    if (userProjectIds.length > 0) {
      const globalScripts = await tx
        .select({ id: scripts.id })
        .from(scripts)
        .where(inArray(scripts.projectId, userProjectIds));
      userScriptIds = globalScripts.map((s) => s.id);
    }

    // Delete relationships (children first)

    // ai_executions -> depends on scripts, characters, projects, users. Delete this FIRST.
    await tx.delete(aiExecutions).where(eq(aiExecutions.userId, userId));

    // script_prompts -> depends on scripts
    if (userScriptIds.length > 0) {
      await tx
        .delete(scriptPrompts)
        .where(inArray(scriptPrompts.scriptId, userScriptIds));
    }

    // scripts -> depends on projects
    if (userProjectIds.length > 0) {
      await tx
        .delete(scripts)
        .where(inArray(scripts.projectId, userProjectIds));
    }

    // project_characters -> depends on projects (and characters)
    if (userProjectIds.length > 0) {
      await tx
        .delete(projectCharacters)
        .where(inArray(projectCharacters.projectId, userProjectIds));
    }

    // prompts -> depends on user
    await tx.delete(prompts).where(eq(prompts.userId, userId));

    // creative_profiles -> depends on user
    await tx
      .delete(creativeProfiles)
      .where(eq(creativeProfiles.userId, userId));

    // characters -> depends on user (project_characters deleted above)
    await tx.delete(characters).where(eq(characters.userId, userId));

    // projects -> depends on user (scripts/links deleted above)
    await tx.delete(projects).where(eq(projects.userId, userId));

    // 2. IMPORT NEW DATA
    // We must remap IDs because we are inserting new rows which will get new auto-increment IDs.

    const projectIdMap = new Map<number, number>();
    const characterIdMap = new Map<number, number>();
    const scriptIdMap = new Map<number, number>();
    const promptIdMap = new Map<number, number>();

    // A. Independent Entities (Characters, Prompts, Profiles)

    // CHARACTERS
    if (data.characters) {
      for (const item of data.characters) {
        const oldId = item.id;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId: _, ...rest } = item;
        const [inserted] = await tx
          .insert(characters)
          .values({ ...rest, userId })
          .returning();
        if (oldId) characterIdMap.set(oldId, inserted.id);
      }
    }

    // PROMPTS
    if (data.prompts) {
      for (const item of data.prompts) {
        const oldId = item.id;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId: _, ...rest } = item;
        const [inserted] = await tx
          .insert(prompts)
          .values({ ...rest, userId })
          .returning();
        if (oldId) promptIdMap.set(oldId, inserted.id);
      }
    }

    // CREATIVE PROFILES
    if (data.creativeProfiles) {
      for (const item of data.creativeProfiles) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId: _, ...rest } = item;
        await tx.insert(creativeProfiles).values({ ...rest, userId });
      }
    }

    // B. Projects and Dependents

    // PROJECTS
    if (data.projects) {
      for (const item of data.projects) {
        const oldId = item.id;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId: _, ...rest } = item;
        const [inserted] = await tx
          .insert(projects)
          .values({ ...rest, userId })
          .returning();
        if (oldId) projectIdMap.set(oldId, inserted.id);
      }
    }

    // PROJECT CHARACTERS (Links)
    if (data.projectCharacters) {
      for (const item of data.projectCharacters) {
        const newProjId = projectIdMap.get(item.projectId);
        const newCharId = characterIdMap.get(item.characterId);

        if (newProjId && newCharId) {
          await tx.insert(projectCharacters).values({
            projectId: newProjId,
            characterId: newCharId,
          });
        }
      }
    }

    // SCRIPTS
    if (data.scripts) {
      for (const item of data.scripts) {
        const oldId = item.id;
        const newProjId = projectIdMap.get(item.projectId);

        if (newProjId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, projectId: _, ...rest } = item;
          const [inserted] = await tx
            .insert(scripts)
            .values({ ...rest, projectId: newProjId })
            .returning();
          if (oldId) scriptIdMap.set(oldId, inserted.id);
        }
      }
    }

    // SCRIPT PROMPTS
    if (data.scriptPrompts) {
      for (const item of data.scriptPrompts) {
        const newScriptId = scriptIdMap.get(item.scriptId);
        const newPromptId = promptIdMap.get(item.promptId);

        if (newScriptId && newPromptId) {
          await tx.insert(scriptPrompts).values({
            scriptId: newScriptId,
            promptId: newPromptId,
          });
        }
      }
    }

    // AI EXECUTIONS
    // Usually we don't import these on a clean slate unless specified, but if they are in the JSON
    // we should probably try to import them if they don't depend on missing IDs.
    // AI Executions might link to Prompts or Scripts (not foreign keyed strictly in some schemas, but logically linked).
    // The schema usually has userId.
    if (data.aiExecutions) {
      for (const item of data.aiExecutions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId: _, ...rest } = item;
        await tx.insert(aiExecutions).values({
          ...rest,
          userId,
        });
      }
    }
  });
}
