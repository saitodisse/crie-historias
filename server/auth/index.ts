import type { Express, Request, RequestHandler } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";

type AuthMode = "clerk" | "local";

export interface AppAuthUser {
  externalAuthId: string;
  provider: "clerk" | "local";
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AppAuthUser;
  }
}

const authMode: AuthMode = process.env.CLERK_SECRET_KEY ? "clerk" : "local";

function buildLocalAuthUser(): AppAuthUser {
  return {
    externalAuthId: process.env.DEV_AUTH_USER_ID || "local-dev-user",
    provider: "local",
    firstName: process.env.DEV_AUTH_FIRST_NAME || "Dev",
    lastName: process.env.DEV_AUTH_LAST_NAME || "User",
    email: process.env.DEV_AUTH_EMAIL || "dev@example.com",
    profileImageUrl: process.env.DEV_AUTH_IMAGE_URL,
  };
}

function buildClerkAuthUser(req: Request): AppAuthUser | undefined {
  const auth = getAuth(req);
  if (!auth.userId) return undefined;

  const claims = (auth.sessionClaims || {}) as Record<string, unknown>;
  const firstName =
    (claims.first_name as string | undefined) ||
    (claims.given_name as string | undefined);
  const lastName =
    (claims.last_name as string | undefined) ||
    (claims.family_name as string | undefined);
  const email =
    (claims.email as string | undefined) ||
    (claims.email_address as string | undefined);
  const profileImageUrl =
    (claims.image_url as string | undefined) ||
    (claims.picture as string | undefined);

  return {
    externalAuthId: auth.userId,
    provider: "clerk",
    firstName,
    lastName,
    email,
    profileImageUrl,
  };
}

export async function setupAuth(app: Express) {
  if (authMode === "clerk") {
    app.use(clerkMiddleware());
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (authMode === "local") {
    req.authUser = buildLocalAuthUser();
    return next();
  }

  const authUser = buildClerkAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.authUser = authUser;
  return next();
};

export function getAuthUser(req: Request): AppAuthUser {
  const authUser =
    req.authUser || (authMode === "local" ? buildLocalAuthUser() : undefined);

  if (!authUser) {
    throw new Error("Unauthorized");
  }

  return authUser;
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const authUser = getAuthUser(req);
    res.json({
      id: authUser.externalAuthId,
      email: authUser.email || null,
      firstName: authUser.firstName || null,
      lastName: authUser.lastName || null,
      profileImageUrl: authUser.profileImageUrl || null,
      provider: authUser.provider,
    });
  });

  app.get("/api/login", (_req, res) => {
    if (authMode === "local") {
      return res.redirect("/");
    }

    return res.redirect("/sign-in");
  });

  app.get("/api/logout", (_req, res) => {
    if (authMode === "local") {
      return res.redirect("/");
    }

    return res.redirect("/sign-in");
  });
}
