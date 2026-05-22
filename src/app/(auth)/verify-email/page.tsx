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
import { authService } from "@/services/auth.service";
import { useBusinessSession } from "@/store/business-session-provider";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { setRegistrationDraft } = useBusinessSession();
  const [emailAddress, setEmailAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = /\S+@\S+\.\S+/.test(emailAddress);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.verifyEmail(emailAddress);
      if (response.statusCode !== 200 || !response.data?.otpId) {
        toast.error(response.message || "Unable to verify email.");
        return;
      }

      setRegistrationDraft({
        emailAddress,
        otpId: response.data.otpId,
      });
      toast.success("Verification code sent.");
      router.push("/verify-otp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <AuthSplitShell
        title="Verify Email"
        description="Enter your email address to receive a one-time code and start creating your payment profile."
        illustration="access"
        contentClassName="max-w-[458px]"
      >
        <form className="grid gap-8" onSubmit={handleSubmit}>
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
