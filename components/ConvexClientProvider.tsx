"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { CLERK_JWT_TEMPLATE } from "@/lib/auth";

const LOCAL_DEV_URL = "http://localhost:3210";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? (process.env.NODE_ENV === "development" ? LOCAL_DEV_URL : "");
const convex = new ConvexReactClient(convexUrl);

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL is missing. Set it in your environment variables.");
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchAccessToken = useCallback(
    async () => {
      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
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
