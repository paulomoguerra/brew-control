import type { Metadata } from "next";
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
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "#8B5B3F" } }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/calculator"
      afterSignUpUrl="/calculator"
    >
      <html lang="en">
        <body className="font-sans bg-cream text-slate-900 antialiased selection:bg-cream selection:text-espresso">
          <ConvexClientProvider>
            <UnitProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </UnitProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
