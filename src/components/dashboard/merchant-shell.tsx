"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import {
  AccountsIcon,
  BellIcon,
  ChevronDown,
  DashboardIcon,
  DevelopersIcon,
  MenuIcon,
  PaymentIcon,
  SearchIcon,
  SettingsIcon,
  TransactionsIcon,
} from "@/components/ui/icons";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/dashboard/accounts", label: "Accounts", icon: AccountsIcon },
  { href: "/dashboard/payment", label: "Payment", icon: PaymentIcon },
  { href: "/dashboard/checkout", label: "Checkout", icon: PaymentIcon },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: TransactionsIcon,
  },
  { href: "/dashboard/developers", label: "Developers", icon: DevelopersIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export function MerchantShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, session, clearSession } = useBusinessSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReady && !session) {
      router.replace("/login");
    }
  }, [isReady, router, session]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Loading merchant workspace...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Redirecting to sign in...
      </div>
    );
  }

  const kycStatus = session.business.kyc?.status || "not_submitted";
  const isSettingsPage = pathname === "/dashboard/settings";
  const shouldBlockForCompliance =
    !["pending", "approved"].includes(kycStatus) && !isSettingsPage;

  return (
    <div className="h-screen bg-[var(--background)] overflow-hidden text-slate-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[260px] bg-[#00492c] text-white transition lg:static h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-20 items-center px-6">
          <Wordmark inverted />
        </div>

        <nav className="grid pt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex h-14 items-center gap-3 px-8 text-[14px] font-semibold tracking-[0.01em] transition",
                  active
                    ? "bg-[#e9f7ef] text-[#00884f]"
                    : "bg-[#00492c] text-white hover:bg-[#075b38]",
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    active ? "text-[#00884f]" : "text-white",
                  )}
                />
                <span className={active ? "text-[#00884f]" : "text-white"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden"
          aria-label="Close menu"
        />
      ) : null}

      <div className="min-w-0 h-screen overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-500 lg:hidden"
          >
            <MenuIcon />
          </button>

          <div className="relative hidden w-[300px] md:block">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />
            <input
              placeholder="Search by Name"
              className="h-12 w-full rounded-[10px] border border-transparent bg-[#f5f7f9] pl-12 pr-4 text-sm font-medium text-slate-700 outline-none placeholder:text-[#8d99a8] focus:border-emerald-100 focus:bg-white"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600"
            >
              <BellIcon />
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex h-[45px] items-center gap-3 bg-white transition"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-[var(--brand)]">
                  {getInitials(
                    session.business.businessName ||
                      session.business.contactFirstName ||
                      "A",
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                    {session.business.businessName || "Aris Merchant"}
                  </p>
                  <p className="max-w-[180px] truncate text-xs text-slate-500">
                    {session.business.emailAddress}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "ml-1 h-4 w-4 text-slate-500 transition",
                    profileOpen && "rotate-180",
                  )}
                />
              </button>

              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
                >
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-[var(--brand)]">
                        {getInitials(
                          session.business.businessName ||
                            session.business.contactFirstName ||
                            "A",
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {session.business.businessName || "Aris Merchant"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {session.business.emailAddress}
                        </p>
                        <p className="mt-2 text-xs font-medium capitalize text-emerald-700">
                          {session.business.status || "pending"} account
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Contact
                      </p>
                      <p className="mt-1 text-slate-700">
                        {`${session.business.contactFirstName || ""} ${session.business.contactLastName || ""}`.trim() ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-slate-700">
                        {session.business.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      clearSession();
                      router.replace("/login");
                    }}
                    className="flex h-[45px] w-full items-center justify-center border-t border-slate-100 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-10 sm:px-10 flex-1 overflow-y-auto">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold tracking-[0.01em] text-slate-950">
              {title}
            </h1>
            {actions}
          </div>
          {children}
        </main>
      </div>
      {shouldBlockForCompliance ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[440px] rounded-[14px] bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f6ef] text-[#0a9550]">
              <SettingsIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[20px] font-bold text-[#101828]">
              Complete your account setup
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-[#667085]">
              Submit your business compliance details to continue. Once your
              documents are submitted, this setup blocker will be removed while
              admin review continues in the background.
            </p>
            <Button
              type="button"
              className="dashboard-black-button mt-7 w-full"
              onClick={() => {
                window.dispatchEvent(new Event("aris-pay:open-compliance"));
                router.replace("/dashboard/settings?tab=compliance");
              }}
            >
              Complete Setup
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
