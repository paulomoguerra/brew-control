import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { UnitProvider } from "@/lib/units";
import { ToastProvider } from "@/components/ui/Toast";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brewline | Universal Coffee Calculator",
  description: "A phone-first universal calculator with brewing science and sensory lab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-cream text-slate-900 antialiased selection:bg-cream selection:text-espresso">
        <ClerkProvider appearance={{ variables: { colorPrimary: "#8B5B3F" } }}>
          <ConvexClientProvider>
            <UnitProvider>
              <ToastProvider>
                <AppShell>
                  {children}
                </AppShell>
              </ToastProvider>
            </UnitProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
