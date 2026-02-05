"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

// HARDCODED FIX: Ensure we always connect to the active production backend
// This overrides any potential environment variable mismatches on Vercel
const CONVEX_URL = "https://patient-tern-852.convex.cloud";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || CONVEX_URL);

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.warn(`Using fallback Convex URL: ${CONVEX_URL}`);
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
