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
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current user from localStorage if available
  let userId = null;
  let modifiedUrl = url;
  
  try {
    if (url.includes('/api/protected/')) {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        userId = userData.id;
        
        // Add userId parameter for protected routes
        if (userId) {
          modifiedUrl = url.includes('?') 
            ? `${url}&userId=${userId}` 
            : `${url}?userId=${userId}`;
        }
      }
    }
  } catch (e) {
    console.error("Error reading user from localStorage:", e);
  }
  
  // Add authorization header for API routes
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add authentication headers for all API requests
  try {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const userData = JSON.parse(userString);
      // Include user info in headers for all API requests
      headers["x-user-id"] = userData.id;
      headers["x-user-role"] = userData.role || "faculty";
      headers["x-current-user"] = userString;
    }
  } catch (e) {
    console.error("Error adding auth headers:", e);
  }
  
  const res = await fetch(modifiedUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the current user from localStorage if available
    let userId = null;
    try {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        userId = userData.id;
      }
    } catch (e) {
      console.error("Error reading user from localStorage:", e);
    }
    
    // Add userId for protected routes
    let url = queryKey[0] as string;
    if (userId && url.includes('/api/protected/')) {
      url = url.includes('?') ? `${url}&userId=${userId}` : `${url}?userId=${userId}`;
    }
    
    // Add authentication headers for all API requests
    const headers: Record<string, string> = {};
    try {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        // Include user info in headers for all API requests
        headers["x-user-id"] = userData.id;
        headers["x-user-role"] = userData.role || "faculty";
        headers["x-current-user"] = userString;
      }
    } catch (e) {
      console.error("Error adding auth headers:", e);
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers: headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
