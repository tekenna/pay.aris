"use client";

import { BusinessSessionProvider } from "@/store/business-session-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <BusinessSessionProvider>{children}</BusinessSessionProvider>;
}
