"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("CRITICAL: NEXT_PUBLIC_CONVEX_URL is not defined. Check your .env file or Vercel environment variables.");
}

const convex = new ConvexReactClient(convexUrl || "http://localhost:1234"); // Fallback to prevent crash but will show errors in console

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
