"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function SetupPasswordPage() {
  const router = useRouter();
  const { registrationDraft, setSession, clearRegistrationDraft } = useBusinessSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = password.length >= 8 && confirmPassword.length >= 8;

  useEffect(() => {
    if (!registrationDraft.token || !registrationDraft.businessName) {
      router.replace("/create-account");
    }
  }, [registrationDraft.businessName, registrationDraft.token, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.registerBusiness({
        token: registrationDraft.token,
        businessName: registrationDraft.businessName,
        legalName: registrationDraft.legalName,
        contactFirstName: registrationDraft.contactFirstName,
        contactLastName: registrationDraft.contactLastName,
        phoneNumber: registrationDraft.phoneNumber,
        password,
        website: registrationDraft.website,
        industry: registrationDraft.industry,
        description: registrationDraft.description,
        address: {
          street: registrationDraft.addressStreet,
          city: registrationDraft.addressCity,
          state: registrationDraft.addressState,
          country: registrationDraft.addressCountry,
          postalCode: registrationDraft.addressPostalCode,
        },
      });

      if (response.statusCode !== 200 || !response.data?.token) {
        toast.error(response.message || "Unable to create account.");
        return;
      }

      setSession({
        business: response.data.business,
        token: response.data.token,
      });
      clearRegistrationDraft();
      toast.success("Account created successfully.");
      router.push("/onboarding-success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <AuthSplitShell
        title="Setup Password"
        description={
          <>
            <div>Set a strong password to protect your payment profile.</div>
            <div>You&apos;ll use it to manage payments and settlements.</div>
          </>
        }
        illustration="access"
        contentClassName="max-w-[454px]"
      >
        <form className="grid gap-6" onSubmit={handleSubmit}>
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
            <AuthBackButton href="/create-account" />
            <AuthPrimaryButton
              type="submit"
              className="w-[178px]"
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
