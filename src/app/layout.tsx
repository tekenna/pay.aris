import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/store/app-providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Aris Wallex Pay",
  description: "Business payments, settlement, and checkout management for Aris Wallex merchants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
