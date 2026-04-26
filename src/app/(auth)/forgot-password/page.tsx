"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthBackButton,
  AuthPrimaryButton,
  AuthSplitShell,
  AuthTextInput,
} from "@/features/auth/components/auth-shell";

export default function ForgotPasswordPage() {
  const [emailAddress, setEmailAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = /\S+@\S+\.\S+/.test(emailAddress);

  return (
    <AuthGuard>
      <AuthSplitShell
        title="Forgot Password"
        description={
          <>
            <div>Enter the email linked to your payment profile.</div>
            <div>We&apos;ll help you regain access to your dashboard.</div>
          </>
        }
        illustration="security"
        contentClassName="max-w-[458px]"
      >
        <form
          className="grid gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isFormValid) {
              toast.error("Enter a valid email address.");
              return;
            }

            setSubmitting(true);
            toast.success("Reset request captured. Check your inbox for recovery instructions.");
            setSubmitting(false);
          }}
        >
          <AuthTextInput
            type="email"
            placeholder="Email Address"
            value={emailAddress}
            onChange={setEmailAddress}
          />

          <div className="flex items-center justify-between gap-4 pt-2">
            <AuthBackButton href="/login" />
            <AuthPrimaryButton
              type="submit"
              className="w-[176px]"
              disabled={!isFormValid}
              loading={submitting}
            >
              Continue
            </AuthPrimaryButton>
          </div>
        </form>
      </AuthSplitShell>
    </AuthGuard>
  );
}
