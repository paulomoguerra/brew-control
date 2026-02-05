"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";

const DEFAULT_CONVEX_URL = "https://outgoing-malamute-801.convex.cloud";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || DEFAULT_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.warn(`NEXT_PUBLIC_CONVEX_URL not set; using fallback Convex URL: ${DEFAULT_CONVEX_URL}`);
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchAccessToken = useCallback(
    async () => {
      try {
        const token = await getToken({ template: "convex" });
        if (!token) {
          console.warn("Clerk token missing for Convex. Check JWT template name and audience.");
        }
        return token ?? null;
      } catch {
        console.warn("Failed to fetch Clerk token for Convex.");
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
