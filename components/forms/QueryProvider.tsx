"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query context for the pages that fetch on the client (the booking
 * form's availability lookup). It is mounted per page rather than in the root
 * layout, so every other page ships without the library.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
