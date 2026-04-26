"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthBackButton,
  AuthPrimaryButton,
  AuthSplitShell,
  AuthTextInput,
} from "@/features/auth/components/auth-shell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isFormValid = password.length >= 8 && confirmPassword.length >= 8;

  return (
    <AuthGuard>
      <AuthSplitShell
        title="Reset Password"
        description={
          <>
            <div>Set a strong password to protect your payment profile.</div>
            <div>You&apos;ll use it to access checkout and settlement activity.</div>
          </>
        }
        illustration="security"
        contentClassName="max-w-[468px]"
      >
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isFormValid) {
              toast.error("Password must be at least 8 characters.");
              return;
            }

            if (password !== confirmPassword) {
              toast.error("Password confirmation does not match.");
              return;
            }
            toast.success("Password updated successfully.");
            router.push("/password-reset-success");
          }}
        >
          <AuthTextInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
          />
          <AuthTextInput
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <div className="flex items-center justify-between gap-4 pt-2">
            <AuthBackButton href="/forgot-password" />
            <AuthPrimaryButton type="submit" className="w-[178px]" disabled={!isFormValid}>
              Continue
            </AuthPrimaryButton>
          </div>
        </form>
      </AuthSplitShell>
    </AuthGuard>
  );
}
