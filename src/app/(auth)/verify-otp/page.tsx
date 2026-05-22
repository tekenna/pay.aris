"use client";

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
  const { registrationDraft, setRegistrationDraft } = useBusinessSession();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = otp.length === 6;

  useEffect(() => {
    if (!registrationDraft.otpId) {
      router.replace("/verify-email");
    }
  }, [registrationDraft.otpId, router]);

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
              <span className="text-[#057f4a]">
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

          <div className="text-[14px] leading-6 text-[#667085] sm:text-[15px] sm:leading-7">
            Didn&apos;t recieve the OTP?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-[#0a9550]"
            >
              Resend Code
            </button>{" "}
            or{" "}
            <a href="/verify-email" className="font-semibold text-[#0a9550]">
              Change Email Address
            </a>
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
