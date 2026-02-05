"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";

// HARDCODED FIX: Ensure we always connect to the active production backend
// This overrides any potential environment variable mismatches on Vercel
const CONVEX_URL = "https://patient-tern-852.convex.cloud";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || CONVEX_URL);

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.warn(`Using fallback Convex URL: ${CONVEX_URL}`);
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchAccessToken = useCallback(
    async () => {
      try {
        return await getToken({ template: "convex" });
      } catch {
        return null;
      }
    },
    [getToken]
  );

  const useConvexAuth = useMemo(
    () => () => ({
      isLoading: !isLoaded,
      isAuthenticated: !!isSignedIn,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken]
  );

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
