"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthPageShell,
  AuthSocialButton,
  GithubIcon,
  GoogleIcon,
  LinkedInIcon,
} from "@/features/auth/components/auth-shell";
import { merchantApi } from "@/lib/merchant-api";
import { useBusinessSession } from "@/store/business-session-provider";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useBusinessSession();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = /\S+@\S+\.\S+/.test(emailAddress) && password.length >= 1;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) {
      toast.error("Enter a valid email address and password.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await merchantApi.login(emailAddress, password);
      if (response.statusCode !== 200 || !response.data?.token) {
        toast.error(response.message || "Unable to sign in.");
        return;
      }

      setSession(response.data);
      toast.success("Welcome back. Your payment dashboard is ready.");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <AuthPageShell>
        <p className="mt-[100px] text-[20px] font-normal">
          Sign in to you account.
        </p>

        <form className="grid gap-6 mt-8" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            placeholder="name@example.com"
            fieldSize="md"
            fieldClassName="rounded-[8px] border-transparent px-5"
            labelClassName="mb-3 text-[16px] font-normal text-white"
            className="text-[14px] font-normal"
            required
          />

          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              fieldSize="md"
              fieldClassName="rounded-[8px] border-transparent px-5"
              labelClassName="mb-3 text-[16px] font-normal text-white"
              className="text-[14px] font-normal"
              required
            />
            <div className="mt-4 text-right">
              <Link
                href="/forgot-password"
                className="text-[15px] text-white underline decoration-white/70 underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={!isFormValid}
            className="mt-2 h-[45px] w-full rounded-[8px] bg-[#4db381] text-[17px] font-semibold hover:bg-[#43a575]"
          >
            Sign in
          </Button>
        </form>

        <div className="mt-10 flex justify-center gap-5">
          <AuthSocialButton label="Continue with Google">
            <GoogleIcon />
          </AuthSocialButton>
          <AuthSocialButton label="Continue with GitHub">
            <GithubIcon />
          </AuthSocialButton>
          <AuthSocialButton
            label="Continue with LinkedIn"
            className="text-[#0a66c2]"
          >
            <LinkedInIcon />
          </AuthSocialButton>
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/verify-email"
            className="text-[15px] text-white underline decoration-white/70 underline-offset-2"
          >
            Create an account
          </Link>
        </div>
      </AuthPageShell>
    </AuthGuard>
  );
}
