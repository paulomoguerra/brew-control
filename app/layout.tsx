import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { UnitProvider } from "@/lib/units";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoasterOS | Finance-First ERP",
  description: "Manage green inventory, roasting, and unit economics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900 antialiased selection:bg-amber-100 selection:text-amber-900">
        <ConvexClientProvider>
          <UnitProvider>
            <ToastProvider>
              <AppShell>
                {children}
              </AppShell>
            </ToastProvider>
          </UnitProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}