"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthPrimaryButton,
  AuthSplitShell,
  AuthTextInput,
} from "@/features/auth/components/auth-shell";
import { merchantApi } from "@/lib/merchant-api";

function InvitationAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [invitation, setInvitation] = useState<{
    businessName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
    role?: string | null;
  } | null>(null);
  const isFormValid = password.length >= 8 && confirmPassword.length >= 8;

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        toast.error("Invitation token is missing.");
        router.replace("/login");
        return;
      }

      setLoadingPreview(true);
      try {
        const response = await merchantApi.previewInvitation(token);
        if (response.statusCode !== 200) {
          toast.error(response.message || "Invitation is invalid or expired.");
          router.replace("/login");
          return;
        }

        setInvitation(response.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invitation is invalid or expired.");
        router.replace("/login");
      } finally {
        setLoadingPreview(false);
      }
    }

    void loadInvitation();
  }, [router, token]);

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
      const response = await merchantApi.acceptInvitation(token, password);
      if (response.statusCode !== 200) {
        toast.error(response.message || "Unable to accept invitation.");
        return;
      }

      toast.success(response.message || "Invitation accepted successfully.");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      title="Accept invitation"
      description={
        loadingPreview ? (
          <>Loading invitation details...</>
        ) : (
          <>
            <div>
              {invitation?.firstName || "You"} have been invited to join{" "}
              {invitation?.businessName || "a business"} on Aris Pay.
            </div>
            <div>
              Create your password to activate your {invitation?.role || "team"} access.
            </div>
          </>
        )
      }
      illustration="access"
      contentClassName="max-w-[454px]"
    >
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <AuthTextInput
          value={invitation?.emailAddress || ""}
          onChange={() => undefined}
          placeholder="Email address"
          disabled
        />
        <AuthTextInput
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={setPassword}
        />
        <AuthTextInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <AuthPrimaryButton
          type="submit"
          className="w-full"
          disabled={!isFormValid || loadingPreview}
          loading={submitting}
        >
          Accept Invitation
        </AuthPrimaryButton>
      </form>
    </AuthSplitShell>
  );
}

export default function InviteAcceptancePage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <AuthSplitShell
            title="Accept invitation"
            description={<>Loading invitation details...</>}
            illustration="access"
            contentClassName="max-w-[454px]"
          >
            <div />
          </AuthSplitShell>
        }
      >
        <InvitationAcceptanceContent />
      </Suspense>
    </AuthGuard>
  );
}
