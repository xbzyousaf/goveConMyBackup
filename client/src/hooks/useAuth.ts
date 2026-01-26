import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/current-user"],
    retry: false,
    throwOnError: false, // Don't throw on 401s
    queryFn: async () => {
      const response = await fetch("/api/auth/current-user", {
        credentials: 'include', // Include cookies for both session and Replit auth
      });
      
      if (response.status === 401) {
        // Return null for unauthenticated users, don't throw
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
    isError: error && !error.message.includes('401'),
  };
}