// src/lib/queryClient.ts
// Configuración central de TanStack Query.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
