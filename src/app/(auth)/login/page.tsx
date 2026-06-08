"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtIcon } from "@/components/ui/icons";
import { AuthPageShell } from "@/features/auth/components/auth-shell";
import { authService } from "@/services/auth.service";
import { clearAllBrowserStorage } from "@/services/session-storage";
import { useBusinessSession } from "@/store/business-session-provider";

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8.5 11V8.8a3.5 3.5 0 0 1 7 0V11" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useBusinessSession();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = /\S+@\S+\.\S+/.test(emailAddress) && password.length >= 1;

  useEffect(() => {
    clearAllBrowserStorage();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) {
      toast.error("Enter a valid email address and password.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.login(emailAddress, password);
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
    <AuthPageShell illustration="access">
      <div className="max-w-[392px]">
        <div className="text-center md:text-left">
          <h1 className="text-[34px] font-medium leading-[1.08] tracking-[-0.04em] text-[#111827] sm:text-[40px]">
            Welcome Back!
          </h1>
          <p className="mt-4 text-[15px] leading-[1.8] text-[#5f6b76]">
            Sign in to access your dashboard and continue optimizing your
            payment operations.
          </p>
        </div>

        <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            placeholder="Enter your email"
            leftIcon={<AtIcon className="h-4 w-4" />}
            fieldSize="md"
            fieldClassName="rounded-[14px] border border-[#d9e3e6] bg-white px-4 shadow-none focus-within:border-[#0e6b71] focus-within:shadow-[0_0_0_4px_rgba(14,107,113,0.08)]"
            labelClassName="mb-3 text-[14px] font-medium text-[#111827]"
            className="text-[14px] font-medium text-[#162033] placeholder:text-[#99a5af]"
            required
          />

          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              leftIcon={<LockIcon />}
              fieldSize="md"
              fieldClassName="rounded-[14px] border border-[#d9e3e6] bg-white px-4 shadow-none focus-within:border-[#0e6b71] focus-within:shadow-[0_0_0_4px_rgba(14,107,113,0.08)]"
              labelClassName="mb-3 text-[14px] font-medium text-[#111827]"
              className="text-[14px] font-medium text-[#162033] placeholder:text-[#99a5af]"
              required
            />
            <div className="mt-3 text-right">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-[#0e5961] transition hover:text-[#0b4d54]"
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
            className="mt-2 h-[52px] w-full rounded-[14px] bg-[#0e5961] text-[15px] font-semibold shadow-none hover:bg-[#0b4d54]"
          >
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-center text-[14px] text-[#5f6b76]">
          Don&apos;t have an account?{" "}
          <Link
            href="/verify-email"
            className="font-semibold text-[#0e5961] transition hover:text-[#0b4d54]"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
