import type { Express } from "express";
import { createServer, type Server } from "http";
import projectsRouter from "./routes/projects";
import charactersRouter from "./routes/characters";
import scriptsRouter from "./routes/scripts";
import promptsRouter from "./routes/prompts";
import profilesRouter from "./routes/profiles";
import aiRouter from "./routes/ai";
import adminRouter from "./routes/admin";
import { getAppUser, toInt } from "./routes/utils"; // export these for reuse if needed elsewhere, but registerRoutes doesn't use them directly

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Observabilidade no servidor
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    if (path.startsWith("/api")) {
      const body =
        req.body && Object.keys(req.body).length > 0
          ? JSON.stringify(req.body, null, 2)
          : "sem corpo";
      console.log(
        `\x1b[36m[Server Request]\x1b[0m ${req.method} ${path}\nBody: ${body}`
      );

      const originalJson = res.json;
      res.json = function (data) {
        const duration = Date.now() - start;
        console.log(
          `\x1b[32m[Server Response]\x1b[0m ${req.method} ${path} ${res.statusCode} (${duration}ms)\nPayload: ${JSON.stringify(data, null, 2)}`
        );
        return originalJson.call(this, data);
      };
    }
    next();
  });

  app.use("/api", projectsRouter);
  app.use("/api", charactersRouter);
  app.use("/api", scriptsRouter);
  app.use("/api", promptsRouter);
  app.use("/api", profilesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", aiRouter);

  return httpServer;
}

// Re-export utility functions if needed by other files that might import them from routes.ts
// Although ideally they should import from routes/utils directly.
export { getAppUser, toInt };
