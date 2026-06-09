"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuthLogo } from "@/features/auth/components/auth-logo";

type AuthIllustrationVariant = "security" | "access";

const authTestimonials: Record<
  AuthIllustrationVariant,
  {
    badge: string;
    title: string;
    quote: string;
    name: string;
    role: string;
  }
> = {
  security: {
    badge: "Trusted for secure access",
    title: "Keep every login, transfer, and payout protected.",
    quote:
      "Aris helps our team stay fast without losing confidence in the security of every payment workflow.",
    name: "Ada Okafor",
    role: "Operations Lead at Nexa Retail",
  },
  access: {
    badge: "Built for growing teams",
    title: "Power growth with cleaner payment operations.",
    quote:
      "We launch faster with Aris because checkout, transfers, and reconciliation all feel simple in one place.",
    name: "Michael Carter",
    role: "Finance Manager at Tekspace",
  },
};

const authFeatureHighlights = [
  "Create payment links in minutes.",
  "Track settlements and transfers clearly.",
  "Manage your team from one dashboard.",
];

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
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.3-.3-4.7-1.2-4.7-5A3.9 3.9 0 0 1 6.6 9c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.8 9.8 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1.1 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.9 8.8H3.8V20h3.1V8.8ZM5.4 7.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM20.2 13.8c0-3-1.6-5.2-4.3-5.2-1.9 0-2.8 1-3.3 1.8V8.8h-3V20h3.1v-5.6c0-1.5.3-3 2.2-3 1.8 0 1.8 1.7 1.8 3.1V20h3.1v-6.2Z" />
    </svg>
  );
}

export function AuthSocialButton({
  children,
  label,
  className,
  type = "button",
  ...props
}: {
  children: ReactNode;
  label: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#d9e3e6] bg-white px-5 text-[14px] font-medium text-[#0f1728] transition hover:border-[#bfd3d7] hover:bg-[#fbfdfd]",
        className,
      )}
      {...props}
    >
      <span className="shrink-0">{children}</span>
      <span>{label}</span>
    </button>
  );
}

export function AuthMarketingPanel({
  variant = "security",
}: {
  variant?: AuthIllustrationVariant;
}) {
  const testimonial = authTestimonials[variant];

  return (
    <aside className="relative hidden min-h-[100svh] overflow-hidden bg-[#0b4950] px-8 py-10 text-white md:flex md:flex-col md:justify-between lg:px-10 lg:py-12 xl:px-14 xl:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(136,224,216,0.34),transparent_24%),radial-gradient(circle_at_70%_42%,rgba(120,208,201,0.16),transparent_28%),linear-gradient(180deg,#0d4d55_0%,#0a4349_100%)]" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/8" />

      <div className="relative z-10 max-w-[540px] pt-10 xl:pt-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {testimonial.badge}
        </p>
        <h2 className="mt-10 max-w-[520px] text-[44px] font-medium leading-[1.12] tracking-[-0.04em] text-white xl:text-[58px]">
          {testimonial.title}
        </h2>
        <div className="mt-10 flex gap-4">
          <span className="text-[52px] font-medium leading-none text-white/90">
            &ldquo;
          </span>
          <div>
            <p className="max-w-[480px] text-[18px] leading-[1.7] text-white/90">
              {testimonial.quote}
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-[14px] font-semibold">
                {testimonial.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">
                  {testimonial.name}
                </p>
                <p className="mt-1 text-[13px] text-white/72">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16">
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
            Why teams choose Aris
          </p>
          <div className="h-px flex-1 bg-white/18" />
        </div>
        <div className="mt-6 grid gap-3 text-[15px] leading-7 text-white/82">
          {authFeatureHighlights.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-[#8be3d2]" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function AuthPageShell({
  children,
  contentClassName,
  showMarketingPanel = true,
  illustration = "security",
}: {
  children: ReactNode;
  contentClassName?: string;
  showMarketingPanel?: boolean;
  illustration?: AuthIllustrationVariant;
}) {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#f2f6f7]">
      <div
        className={cn(
          "mx-auto grid min-h-[100svh] max-w-[1480px] bg-white md:overflow-hidden md:rounded-[26px] md:border md:border-[#d8e4e7]",
          showMarketingPanel && "md:grid-cols-[minmax(480px,0.94fr)_minmax(0,1fr)]",
        )}
      >
        <section className="relative flex min-h-[100svh] flex-col bg-[#fbfcfc] px-6 py-7 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <div className="relative z-10 flex min-h-[100svh] flex-col items-center md:items-start">
            <Link
              href="/"
              className="inline-flex w-fit self-center md:self-start"
            >
              <AuthLogo className="h-[30px] w-[150px]" />
            </Link>
            <div
              className={cn(
                "auth-hidden-scrollbar flex w-full flex-1 items-start justify-center py-10 sm:py-12 md:items-center md:overflow-y-auto",
                showMarketingPanel && "md:justify-start",
              )}
            >
              <div
                className={cn("w-full max-w-[456px] min-w-0", contentClassName)}
              >
                {children}
              </div>
            </div>
          </div>
        </section>

        {showMarketingPanel ? (
          <AuthMarketingPanel variant={illustration} />
        ) : null}
      </div>
    </main>
  );
}

// export function AuthIllustration({
//   variant = "security",
// }: {
//   variant?: "security" | "access";
// }) {
//   return (
//     <aside className="relative hidden min-h-screen overflow-hidden rounded-l-[50px] bg-[#005330] lg:block">
//       <Image
//         src="/images/auth.svg"
//         alt={
//           variant === "access"
//             ? "Aris payment access illustration"
//             : "Aris payment security illustration"
//         }
//         fill
//         priority
//         sizes="50vw"
//         className="object-cover object-left"
//       />
//     </aside>
//   );
// }

export function AuthTextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled,
  readOnly,
  name,
  required,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
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
      readOnly={readOnly}
      required={required}
      labelPlacement="inside"
      fieldSize="md"
      fieldClassName="rounded-[14px] border border-[#d9e3e6] bg-white px-4 shadow-none focus-within:border-[#0e6b71] focus-within:shadow-[0_0_0_4px_rgba(14,107,113,0.08)] disabled:bg-[#f3f6f7] read-only:bg-[#f3f6f7]"
      labelClassName="text-[#8a98a5]"
      className={cn(
        "text-[14px] font-medium text-[#162033] placeholder:text-[#99a5af] read-only:cursor-default",
        className,
      )}
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
      fieldClassName="rounded-[14px] border border-[#d9e3e6] bg-white px-4 shadow-none focus-within:border-[#0e6b71] focus-within:shadow-[0_0_0_4px_rgba(14,107,113,0.08)] disabled:bg-[#f3f6f7]"
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
      className={cn(
        "h-[52px] rounded-[14px] bg-[#0e5961] px-6 text-[15px] font-semibold text-white shadow-none hover:bg-[#0b4d54] disabled:bg-[#b7c7ca] disabled:text-white",
        className,
      )}
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
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-2 text-[15px] font-semibold text-[#5f6b76] transition hover:text-[#0e5961]"
    >
      <span className="text-[22px] leading-none">←</span>
      <span>{children}</span>
    </Link>
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
      illustration={illustration}
    >
      {title || description ? (
        <div className="mb-8 text-center md:text-left">
          {title ? (
            <h1 className="text-[34px] font-medium leading-[1.08] tracking-[-0.04em] text-[#111827] sm:text-[40px]">
              {title}
            </h1>
          ) : null}
          {description ? (
            <div className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.75] text-[#5f6b76] sm:text-[16px] md:mx-0">
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
          className="h-12 min-w-0 rounded-[14px] border border-[#d9e3e6] bg-white text-center text-[18px] font-semibold text-[#162033] outline-none transition focus:border-[#0e6b71] focus:shadow-[0_0_0_4px_rgba(14,107,113,0.08)] sm:h-14"
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
      <h1 className="mt-8 text-[32px] font-medium tracking-[-0.03em] text-[#111827]">
        {title}
      </h1>
      <div className="mt-4 text-[16px] leading-[1.75] text-[#5f6b76]">
        {description}
      </div>
      <a href={buttonHref} className="mt-8 inline-flex w-full max-w-[378px]">
        <AuthPrimaryButton className="w-full">{buttonLabel}</AuthPrimaryButton>
      </a>
    </AuthPageShell>
  );
}
