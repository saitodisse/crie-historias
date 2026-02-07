import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/clerk-react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  provider: "clerk" | "local";
}

async function fetchUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const clerk = hasClerkKey ? useClerk() : null;
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (hasClerkKey && clerk) {
        await clerk.signOut({ redirectUrl: "/sign-in" });
        return;
      }

      await logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
