"use client";

import { AuthSuccessShell } from "@/features/auth/components/auth-shell";

export default function OnboardingSuccessPage() {
  return (
    <AuthSuccessShell
      title="Account Created Successfully"
      description={
        <>
          <div>Your payment account has been created.</div>
          <div>Continue to sign in and start tracking</div>
          <div>payments, checkout, and settlements.</div>
        </>
      }
      buttonLabel="Continue"
      buttonHref="/login"
    />
  );
}
