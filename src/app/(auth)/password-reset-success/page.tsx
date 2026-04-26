"use client";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthPrimaryButton,
  AuthSplitShell,
} from "@/features/auth/components/auth-shell";

export default function PasswordResetSuccessPage() {
  return (
    <AuthGuard>
      <AuthSplitShell
        title=""
        description=""
        illustration="security"
        contentClassName="max-w-[468px]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-[#e6f3ec]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="m5.5 12.5 4.2 4.1 8.8-9"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.02em] text-white">
            Password updated!
          </h1>
          <div className="mt-4 text-[17px] leading-[1.65] text-white/72">
            <div>Your password was updated successfully.</div>
            <div>Please click continue to log in.</div>
          </div>
          <a href="/login" className="mt-8 w-full max-w-[378px]">
            <AuthPrimaryButton className="w-full">Continue</AuthPrimaryButton>
          </a>
        </div>
      </AuthSplitShell>
    </AuthGuard>
  );
}
