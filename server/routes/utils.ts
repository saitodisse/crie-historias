import { storage } from "../storage";
import { getAuthUser } from "../auth";

export function toInt(value: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(raw, 10);
}

export async function getAppUser(req: any) {
  const authUser = getAuthUser(req);
  if (!authUser) return null; // Handle case where authUser might be missing if not authenticated (though usually protected)

  const displayName =
    [authUser.firstName, authUser.lastName].filter(Boolean).join(" ") ||
    undefined;

  return storage.getOrCreateUserByExternalAuthId(
    authUser.externalAuthId,
    authUser.provider,
    displayName
  );
}
