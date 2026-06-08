import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";

const platformFeatures = [
  "Collect one-time and recurring payments from your app or website.",
  "Make instant transfers.",
];

const checkoutFeatures = ["Bank Transfers", "Payment Links"];

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#edf2ec] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b5563] shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <span className="mr-1.5 text-[11px] text-[#ff9f1a]">✦</span>
      {children}
    </span>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[14px] font-medium leading-7 text-black md:text-[15px]">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5fe2b0] text-[#035b37]">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}

function FooterSocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#0a5c46] transition hover:bg-[#eef7f2] hover:text-[#084f3c]"
    >
      {children}
    </a>
  );
}

export default function HomePage() {
  return (
    <main className="font-landing min-h-screen overflow-x-hidden bg-white text-black">
      <section className="relative overflow-hidden bg-[#eefaf4]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.svg"
            alt=""
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover object-center opacity-95"
          />
        </div>

        <div className="relative mx-auto flex min-h-[620px] max-w-[1240px] flex-col px-4 pb-8 pt-3 sm:px-5 md:px-8 lg:min-h-[720px] lg:px-10 lg:pb-0">
          <header className="flex flex-col gap-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" aria-label="Aris Wallex home">
              <Wordmark compact />
            </Link>

            <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-none">
              <Link href="/login">
                <Button className="h-[42px] w-full min-w-0 rounded-[9px] bg-[#005761] px-4 text-[13px] font-semibold shadow-none hover:bg-[#087844] sm:min-w-[106px] sm:px-6">
                  Login
                </Button>
              </Link>
              <Link href="/verify-email">
                <Button
                  variant="secondary"
                  className="h-[42px] w-full min-w-0 rounded-[9px] border border-[#d7dde3] bg-white px-4 text-[13px] font-semibold text-[#202433] shadow-none hover:bg-[#f8fbfd] sm:min-w-[112px] sm:px-6"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </header>

          <div className="flex w-full flex-1 items-center lg:pt-8">
            <div className="relative z-10 h-full max-w-[590px] pb-6 pt-6 text-center sm:pt-8 sm:text-left lg:pb-20">
              <SectionBadge>100% Trusted Platform</SectionBadge>

              <h1 className="mt-5 text-[34px] font-black leading-[0.96] tracking-[-0.05em] text-black sm:text-[44px] md:text-[52px] lg:text-[56px]">
                Seamless digital payment solutions across{" "}
                <span className="text-[#005761]">Africa</span>
              </h1>

              <p className="mt-4 max-w-[390px] text-[15px] leading-7 text-[#5f6b76] sm:text-[16px] sm:leading-8">
                Building a business is hard. Getting paid shouldn&apos;t be.
              </p>

              <div className="mt-7">
                <Link href="/verify-email">
                  <Button className="h-[48px] w-full rounded-[10px] bg-[#005761] px-8 text-[14px] font-semibold shadow-none hover:bg-[#005761] sm:w-auto">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-14 sm:px-5 md:px-8 md:pb-20 md:pt-18 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-[630px] text-center">
          <SectionBadge>Services</SectionBadge>
          <h2 className="mx-auto mt-5 max-w-[560px] text-[28px] font-black leading-[1.04] tracking-[-0.04em] text-black sm:text-[36px] md:text-[48px] lg:text-[52px]">
            Can Help You Achieve Financial Succes
          </h2>
        </div>

        <div className="mt-12 grid gap-14 lg:mt-16 lg:gap-18">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:gap-14">
            <div className="max-w-[460px] text-center lg:pl-16 lg:text-left xl:pl-20">
              <h3 className="max-w-[360px] text-[26px] font-black leading-[1.15] tracking-[-0.03em] text-black md:text-[34px]">
                Create custom payment experiences with simple APIs
              </h3>

              <p className="mt-6 max-w-[420px] text-[15px] leading-8 text-[#667085]">
                Developers love our thorough, well-documented APIs that let you
                build everything from simple weekend projects, to complex
                financial products serving hundreds of thousands of customers.
                If you can imagine it, you can build it with ArisPay.
              </p>

              <ul className="mt-8 grid gap-5 text-left">
                {platformFeatures.map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative h-[270px] w-full max-w-[385px] sm:h-[330px] md:h-[370px] lg:h-[390px]">
                <Image
                  src="/images/creatives.svg"
                  alt="Team creating payment experiences"
                  fill
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] bg-[#e9f9f4] px-5 py-10 sm:px-8 md:px-10 md:py-12 lg:px-14 lg:py-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:gap-16">
              <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
                <div className="relative h-[285px] w-full max-w-[370px] sm:h-[340px] md:h-[380px]">
                  <Image
                    src="/images/seamless.svg"
                    alt="Customer enjoying a smooth checkout"
                    fill
                    className="object-contain object-center"
                  />
                </div>
              </div>

              <div className="order-1 max-w-[430px] text-center lg:order-2 lg:text-left">
                <h3 className="max-w-[420px] text-[26px] font-black leading-[1.15] tracking-[-0.03em] text-black md:text-[34px]">
                  Create a seamless and pleasant checkout experience for your
                  users
                </h3>

                <p className="mt-6 max-w-[430px] text-[15px] leading-8 text-[#667085]">
                  Enable your customers to enjoy smooth and effortless payments.
                  Connect with Arispay once and offer them multiple payment
                  options.
                </p>

                <ul className="mt-8 grid gap-5 text-left">
                  {checkoutFeatures.map((item) => (
                    <BulletItem key={item}>{item}</BulletItem>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-20 pt-2 sm:px-5 md:px-8 lg:px-10 lg:pb-28">
        <div className="absolute inset-x-0 bottom-0 top-12 opacity-75">
          <Image
            src="/images/hero-bg.svg"
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>

        <div className="relative mx-auto max-w-[1240px]">
          <div className="relative overflow-hidden rounded-[24px] bg-[#075d52] px-5 py-12 text-center sm:px-8 md:px-10 md:py-16 lg:px-12 lg:py-20">
            <div className="absolute inset-0 opacity-22">
              <Image
                src="/images/get-started-card-bg.svg"
                alt=""
                fill
                className="object-cover object-left"
              />
            </div>

            <div className="relative mx-auto max-w-[560px]">
              <h2 className="text-[28px] font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-[40px] md:text-[54px] lg:text-[62px]">
                Start accepting payments in just 10 minutes.
              </h2>

              <div className="mt-9">
                <Link href="/verify-email">
                  <Button
                    variant="secondary"
                    className="h-[50px] w-full rounded-[10px] bg-[#ecfaf3] px-8 text-[13px] font-semibold text-[#045c38] shadow-none hover:bg-white sm:w-auto"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex min-h-[220px] max-w-[1240px] flex-col justify-between gap-8 px-4 pb-10 pt-14 sm:px-5 md:px-8 lg:min-h-[260px] lg:px-10 lg:pb-12 lg:pt-18">
          <div>
            <Link href="/" aria-label="Aris Wallex home">
              <Wordmark compact />
            </Link>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <FooterSocialLink href="https://x.com" label="X">
                <FaXTwitter className="h-3.5 w-3.5" />
              </FooterSocialLink>
              <FooterSocialLink href="https://linkedin.com" label="LinkedIn">
                <FaLinkedinIn className="h-3.5 w-3.5" />
              </FooterSocialLink>
              <FooterSocialLink href="https://facebook.com" label="Facebook">
                <FaFacebookF className="h-3.5 w-3.5" />
              </FooterSocialLink>
            </div>

            <p className="text-[13px] text-[#667085]">
              © 2025 Arispay. All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
