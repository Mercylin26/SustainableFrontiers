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
    // Always use both session auth and query param for protected routes as a fallback
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
      } else {
        // Try to get user info from auth context via sessionStorage
        const sessionUser = sessionStorage.getItem('auth_user');
        if (sessionUser) {
          try {
            const userData = JSON.parse(sessionUser);
            userId = userData.id;
            if (userId) {
              modifiedUrl = url.includes('?') 
                ? `${url}&userId=${userId}` 
                : `${url}?userId=${userId}`;
            }
          } catch(e) {
            console.error("Error parsing session user:", e);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error reading user data for URL modification:", e);
  }
  
  // Add standard headers
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add multiple authentication headers for redundancy
  try {
    // Try localStorage first (primary storage)
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const userData = JSON.parse(userString);
      // Include user info in headers for all API requests
      headers["x-user-id"] = String(userData.id);
      headers["x-user-role"] = userData.role || "faculty";
      headers["Authorization"] = `Bearer user-${userData.id}`; // Simple token format
    } else {
      // Fall back to sessionStorage if localStorage is empty
      const sessionUser = sessionStorage.getItem('auth_user');
      if (sessionUser) {
        try {
          const userData = JSON.parse(sessionUser);
          headers["x-user-id"] = String(userData.id);
          headers["x-user-role"] = userData.role || "faculty";
          headers["Authorization"] = `Bearer user-${userData.id}`;
        } catch(e) {
          console.error("Error parsing session user for headers:", e);
        }
      }
    }
  } catch (e) {
    console.error("Error adding auth headers:", e);
  }
  
  // Log authentication info for debugging
  if (url.includes('/api/protected/')) {
    console.log(`Auth headers for ${url}:`, headers);
  }
  
  const res = await fetch(modifiedUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Always send cookies
  });

  // Special handling for 401 errors
  if (res.status === 401) {
    console.warn("Authentication failure detected on API request:", modifiedUrl);
    
    // Try to re-establish session using dev auth
    try {
      if (!url.includes("/login") && !url.includes("/logout")) {
        console.log("Attempting to refresh authentication...");
        // Use our development authentication helper
        await fetch('/api/auth/dev-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (refreshError) {
      console.error("Failed to refresh authentication:", refreshError);
    }
    
    // Continue with original error
    await throwIfResNotOk(res);
  } else {
    await throwIfResNotOk(res);
  }
  
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
      // Try multiple sources for user data
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        userId = userData.id;
      } else {
        // Fall back to sessionStorage
        const sessionUser = sessionStorage.getItem('auth_user');
        if (sessionUser) {
          try {
            const userData = JSON.parse(sessionUser);
            userId = userData.id;
          } catch (e) {
            console.error("Error parsing session user:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error reading user data:", e);
    }
    
    // Add userId for protected routes
    let url = queryKey[0] as string;
    if (url.includes('/api/protected/')) {
      // For protected routes, always add userId if available
      if (userId) {
        url = url.includes('?') ? `${url}&userId=${userId}` : `${url}?userId=${userId}`;
      }
      
      // For protected routes, also add dev=true for development authentication fallback
      url = url.includes('?') ? `${url}&dev=true` : `${url}?dev=true`;
    }
    
    // Add authentication headers for all API requests
    const headers: Record<string, string> = {};
    try {
      // Try localStorage first (primary storage)
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        // Include user info in headers for all API requests
        headers["x-user-id"] = String(userData.id);
        headers["x-user-role"] = userData.role || "faculty";
        headers["Authorization"] = `Bearer user-${userData.id}`; // Simple token format
      } else {
        // Fall back to sessionStorage if localStorage is empty
        const sessionUser = sessionStorage.getItem('auth_user');
        if (sessionUser) {
          try {
            const userData = JSON.parse(sessionUser);
            headers["x-user-id"] = String(userData.id);
            headers["x-user-role"] = userData.role || "faculty";
            headers["Authorization"] = `Bearer user-${userData.id}`;
          } catch(e) {
            console.error("Error parsing session user for headers:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error adding auth headers:", e);
    }
    
    // Log for debugging protected routes
    if (url.includes('/api/protected/')) {
      console.log(`Query headers for ${url}:`, headers);
    }
    
    // Make the request with credentials included
    const res = await fetch(url, {
      credentials: "include",
      headers: headers
    });

    // Handle 401 errors based on behavior setting
    if (res.status === 401) {
      console.warn("Authentication failure on query:", url);
      
      // Try to refresh authentication if it's not a returnNull policy
      if (unauthorizedBehavior === "throw") {
        try {
          // Attempt to re-establish session using dev auth for queries that need authorization
          if (!url.includes("/login") && !url.includes("/logout")) {
            console.log("Attempting to refresh authentication for query...");
            await fetch('/api/auth/dev-session', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (refreshError) {
          console.error("Failed to refresh authentication for query:", refreshError);
        }
      }
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
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
