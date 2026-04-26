"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessSession } from "@/store/business-session-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReady, session } = useBusinessSession();

  useEffect(() => {
    if (isReady && session) {
      router.replace("/dashboard");
    }
  }, [isReady, router, session]);

  if (!isReady || session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-400">
        Preparing workspace...
      </div>
    );
  }

  return <>{children}</>;
}
