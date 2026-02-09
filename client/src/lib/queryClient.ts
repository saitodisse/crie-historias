import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  console.log(
    `[API Request] ${method} ${url}`,
    data ? JSON.stringify(data, null, 2) : "no data"
  );

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.clone().text();
    console.error(`[API Error] ${res.status} ${url}`, errorText);
    await throwIfResNotOk(res);
  }

  const resClone = res.clone();
  try {
    const json = await resClone.json();
    console.log(
      `[API Response] ${res.status} ${url}`,
      JSON.stringify(json, null, 2)
    );
  } catch (e) {
    console.log(`[API Response] ${res.status} ${url} (non-JSON response)`);
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    console.log(`[Query Fetch] ${url}`);
    const res = await fetch(url as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`[Query 401] ${url} returning null`);
      return null;
    }

    if (!res.ok) {
      const errorText = await res.clone().text();
      console.error(`[Query Error] ${res.status} ${url}`, errorText);
      await throwIfResNotOk(res);
    }

    const data = await res.json();
    console.log(`[Query Result] ${url}`, JSON.stringify(data, null, 2));
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
