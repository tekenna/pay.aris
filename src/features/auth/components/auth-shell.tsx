"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuthLogo } from "@/features/auth/components/auth-logo";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.2Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1Z"
      />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.3-.3-4.7-1.2-4.7-5A3.9 3.9 0 0 1 6.6 9c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.8 9.8 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1.1 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M6.9 8.8H3.8V20h3.1V8.8ZM5.4 7.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM20.2 13.8c0-3-1.6-5.2-4.3-5.2-1.9 0-2.8 1-3.3 1.8V8.8h-3V20h3.1v-5.6c0-1.5.3-3 2.2-3 1.8 0 1.8 1.7 1.8 3.1V20h3.1v-6.2Z" />
    </svg>
  );
}

export function AuthSocialButton({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-[45px] w-[45px] items-center justify-center rounded-[8px] bg-white text-black shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:scale-105"
    >
      <span className={className}>{children}</span>
    </button>
  );
}

export function AuthMarketingPanel() {
  return (
    <aside className="relative hidden min-h-[calc(100svh-40px)] overflow-hidden rounded-[8px] bg-[#4db381] px-8 py-10 text-white lg:block xl:px-10 xl:py-12">
      <div className="absolute right-0 top-0 h-[76px] w-[104px] rounded-bl-[8px] bg-black" />
      <div className="absolute right-0 top-[76px] h-[78px] w-[90px] rounded-tr-[8px] bg-[#4db381]" />

      <div className="relative z-10 max-w-[550px]">
        <h2 className="text-[44px] font-semibold leading-[1.32] tracking-[-0.01em]">
          Receive payments
          <br />
          without the friction.
        </h2>
        <p className="mt-2 text-[38px] font-semibold leading-none">&ldquo;</p>
        <p className="mt-8 max-w-[560px] text-[17px] font-semibold leading-[1.8]">
          &ldquo;Aris helps our team create checkout links, monitor transactions, and reconcile customer payments faster.&rdquo;
        </p>
        <div className="mt-10">
          <p className="text-[21px] font-semibold">Ada Okafor</p>
          <p className="mt-2 text-[16px] font-semibold text-white/90">
            Operations Lead, growing with Aris
          </p>
        </div>
        <div className="mt-12 flex gap-4">
          <button
            type="button"
            className="flex h-[45px] w-[58px] items-center justify-center rounded-[6px] bg-white/95 text-[#4db381]"
            aria-label="Previous story"
          >
            <span className="text-2xl leading-none">←</span>
          </button>
          <button
            type="button"
            className="flex h-[45px] w-[58px] items-center justify-center rounded-[6px] bg-[#0c2118] text-white"
            aria-label="Next story"
          >
            <span className="text-2xl leading-none">→</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 rounded-[8px] bg-white px-8 py-8 text-[#17161b]">
        <div className="absolute -right-3 -top-3 flex h-[45px] w-[45px] items-center justify-center rounded-[8px] bg-white text-black">
          <span className="text-[26px] leading-none">✦</span>
        </div>
        <h3 className="max-w-[450px] text-[26px] font-semibold leading-[1.2] tracking-[-0.02em]">
          Get paid by customers
          <br />
          and track every transaction
        </h3>
        <div className="mt-7 flex items-end justify-between gap-8">
          <p className="max-w-[330px] text-[16px] leading-[1.45] text-black/80">
            Manage checkout, settlement, payment records, and account activity from one secure dashboard.
          </p>
          <div className="flex -space-x-3">
            {["bg-amber-200", "bg-rose-300", "bg-cyan-200"].map((color) => (
              <span
                key={color}
                className={`h-8 w-8 rounded-full border-2 border-white ${color}`}
              />
            ))}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#17161b] text-[10px] text-white">
              +2
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AuthPageShell({
  children,
  contentClassName,
  showMarketingPanel = true,
}: {
  children: ReactNode;
  contentClassName?: string;
  showMarketingPanel?: boolean;
}) {
  return (
    <main className="min-h-screen bg-black p-3 text-white sm:p-5">
      <div
        className={cn(
          "grid min-h-[calc(100svh-24px)] gap-5 sm:min-h-[calc(100svh-40px)] sm:gap-8",
          showMarketingPanel
            ? "lg:grid-cols-[minmax(420px,0.92fr)_minmax(560px,1fr)]"
            : "place-items-center",
        )}
      >
        <section className="relative flex min-h-[calc(100svh-24px)] flex-col overflow-hidden rounded-[8px] px-4 py-8 sm:min-h-[calc(100svh-40px)] sm:px-8 sm:py-10 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_62%,rgba(79,179,129,0.5),transparent_26%),radial-gradient(circle_at_64%_50%,rgba(53,131,91,0.45),transparent_18%),linear-gradient(90deg,#020403_0%,#030605_44%,#08140f_100%)]" />
          <div className="relative z-10 flex min-h-full flex-col">
            <Link href="/" className="inline-flex w-fit">
              <AuthLogo className="auth-logo-on-dark h-[30px] w-[154px]" />
            </Link>
            <div className="auth-hidden-scrollbar flex flex-1 overflow-y-auto py-6 sm:py-8">
              <div className={cn("w-full max-w-[448px] min-w-0", contentClassName)}>
                {children}
              </div>
            </div>
          </div>
        </section>
        {showMarketingPanel ? <AuthMarketingPanel /> : null}
      </div>
    </main>
  );
}

export function AuthIllustration({
  variant = "security",
}: {
  variant?: "security" | "access";
}) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden rounded-l-[50px] bg-[#005330] lg:block">
      <Image
        src="/images/auth.svg"
        alt={
          variant === "access"
            ? "Aris payment access illustration"
            : "Aris payment security illustration"
        }
        fill
        priority
        sizes="50vw"
        className="object-cover object-left"
      />
    </aside>
  );
}

export function AuthTextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled,
  name,
  required,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}) {
  return (
    <Input
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      labelPlacement="inside"
      fieldSize="md"
      fieldClassName="rounded-[8px]"
      className={className}
    />
  );
}

export function AuthSelectInput({
  value,
  onChange,
  options,
  className,
  disabled,
  name,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}) {
  return (
    <Select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      required={required}
      options={options}
      labelPlacement="inside"
      fieldSize="md"
      fieldClassName="rounded-[8px]"
      containerClassName={className}
    />
  );
}

export function AuthPrimaryButton({
  children,
  className,
  type = "button",
  disabled,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      type={type}
      disabled={disabled}
      loading={loading}
      size="lg"
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AuthBackButton({
  href,
  children = "Back",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#27364b]"
    >
      <span className="text-[24px] leading-none">←</span>
      <span>{children}</span>
    </a>
  );
}

export function AuthSplitShell({
  title,
  description,
  children,
  illustration = "security",
  contentClassName,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  illustration?: "security" | "access";
  contentClassName?: string;
}) {
  return (
    <AuthPageShell
      contentClassName={contentClassName}
      showMarketingPanel={Boolean(illustration)}
    >
      {title || description ? (
        <div className="my-6 mt-12 sm:my-8 sm:mt-20 lg:mt-24">
          {title ? (
            <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-white sm:text-[28px]">
              {title}
            </h1>
          ) : null}
          {description ? (
            <div className="mt-3 text-[15px] leading-[1.65] text-white/72 sm:text-[16px]">
              {description}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </AuthPageShell>
  );
}

export function AuthOtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const chars = Array.from({ length: 6 }, (_, index) => value[index] || "");

  function updateAt(index: number, nextChar: string) {
    const next = chars.slice();
    next[index] = nextChar;
    onChange(next.join("").trimEnd());
  }

  function applyDigits(startIndex: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      updateAt(startIndex, "");
      return;
    }

    const next = chars.slice();

    digits
      .slice(0, Math.max(0, 6 - startIndex))
      .split("")
      .forEach((digit, offset) => {
        next[startIndex + offset] = digit;
      });

    onChange(next.join("").trimEnd());

    const nextFocusIndex = Math.min(startIndex + digits.length, 5);
    const nextInput = document.getElementById(`auth-otp-${nextFocusIndex}`);
    nextInput?.focus();
  }

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3">
      {chars.map((char, index) => (
        <input
          key={index}
          id={`auth-otp-${index}`}
          value={char}
          inputMode="numeric"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          onChange={(event) => {
            const nextValue = event.target.value;
            const digits = nextValue.replace(/\D/g, "");

            if (digits.length > 1) {
              applyDigits(index, digits);
              return;
            }

            const nextChar = digits.slice(-1);
            updateAt(index, nextChar);
            if (nextChar && index < 5) {
              const nextInput = document.getElementById(
                `auth-otp-${index + 1}`,
              );
              nextInput?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            applyDigits(index, event.clipboardData.getData("text"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !chars[index] && index > 0) {
              const previousInput = document.getElementById(
                `auth-otp-${index - 1}`,
              );
              previousInput?.focus();
            }
          }}
          className="h-12 min-w-0 rounded-[8px] border border-[#d9e4ea] bg-white text-center text-[18px] font-semibold text-[#27364b] outline-none transition focus:border-[#0a9550] sm:h-14"
        />
      ))}
    </div>
  );
}

export function AuthSuccessShell({
  title,
  description,
  buttonLabel,
  buttonHref,
}: {
  title: string;
  description: ReactNode;
  buttonLabel: string;
  buttonHref: string;
}) {
  return (
    <AuthPageShell contentClassName="max-w-[510px] text-center">
      <div className="mx-auto flex h-[45px] w-[45px] items-center justify-center rounded-full bg-[#e6f3ec]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="m5.5 12.5 4.2 4.1 8.8-9"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <h1 className="mt-8 text-[26px] font-semibold text-white">{title}</h1>
      <div className="mt-3 text-[17px] leading-[1.6] text-white/72">
        {description}
      </div>
      <a href={buttonHref} className="mt-8 inline-flex w-full max-w-[378px]">
        <AuthPrimaryButton className="w-full">{buttonLabel}</AuthPrimaryButton>
      </a>
    </AuthPageShell>
  );
}
