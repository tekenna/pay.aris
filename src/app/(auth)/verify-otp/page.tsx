"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthBackButton,
  AuthOtpInput,
  AuthPrimaryButton,
  AuthSplitShell,
} from "@/features/auth/components/auth-shell";
import { authService } from "@/services/auth.service";
import { useBusinessSession } from "@/store/business-session-provider";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { isReady, registrationDraft, setRegistrationDraft } = useBusinessSession();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = otp.length === 6;

  useEffect(() => {
    if (isReady && !registrationDraft.otpId) {
      router.replace("/verify-email");
    }
  }, [isReady, registrationDraft.otpId, router]);

  async function handleVerify() {
    if (!registrationDraft.otpId || !isFormValid) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.verifyOtp(
        registrationDraft.otpId,
        otp,
      );
      if (
        (response.statusCode !== 200 && response.statusCode !== 201) ||
        !response.data?.token
      ) {
        toast.error(response.message || "Unable to verify OTP.");
        return;
      }

      setRegistrationDraft({
        ...registrationDraft,
        token: response.data.token,
      });
      toast.success("Email verified.");
      router.push("/create-account");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify OTP.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!registrationDraft.otpId) {
      return;
    }

    const response = await authService.resendOtp(registrationDraft.otpId);
    if (response.statusCode === 200 || response.statusCode === 201) {
      toast.success(response.message || "Verification code resent.");
    } else {
      toast.error(response.message || "Unable to resend OTP.");
    }
  }

  return (
    <AuthGuard>
      <AuthSplitShell
        title={<> OTP verification</>}
        description={
          <>
            <div>
              Please enter the 6 digit verification code sent to{" "}
              <span className="font-semibold text-[#0e5961]">
                {registrationDraft.emailAddress}
              </span>
            </div>
          </>
        }
        illustration="security"
        contentClassName="max-w-[520px]"
      >
        <div className="grid gap-9">
          <AuthOtpInput value={otp} onChange={setOtp} />

          <div className="text-[14px] leading-6 text-[#5f6b76] sm:text-[15px] sm:leading-7">
            Didn&apos;t receive the OTP?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-[#0e5961]"
            >
              Resend Code
            </button>{" "}
            or{" "}
            <Link href="/verify-email" className="font-semibold text-[#0e5961]">
              Change Email Address
            </Link>
          </div>

          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AuthBackButton href="/verify-email" />
            <AuthPrimaryButton
              type="button"
              onClick={handleVerify}
              disabled={!isFormValid}
              loading={submitting}
              className="w-full sm:w-[176px]"
            >
              Continue
            </AuthPrimaryButton>
          </div>
        </div>
      </AuthSplitShell>
    </AuthGuard>
  );
}
