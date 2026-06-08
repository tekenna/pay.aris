"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  LuArrowLeftRight,
  LuBadgeDollarSign,
  LuCode,
  LuLayoutDashboard,
  LuQrCode,
  LuSettings2,
  LuWalletCards,
} from "react-icons/lu";
import { Wordmark } from "@/components/brand/wordmark";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  ChevronDown,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: LuWalletCards },
  { href: "/dashboard/payment", label: "Payment", icon: LuBadgeDollarSign },
  { href: "/dashboard/checkout", label: "Checkout", icon: LuQrCode },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: LuArrowLeftRight,
  },
  { href: "/dashboard/developers", label: "Developers", icon: LuCode },
  { href: "/dashboard/settings", label: "Settings", icon: LuSettings2 },
] satisfies Array<{ href: string; label: string; icon: IconType }>;

const OWNER_ADMIN_ROLES = new Set(["owner", "admin"]);
const DEVELOPER_VISIBLE_ROLES = new Set([
  "owner",
  "admin",
  "support",
  "developer",
]);

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

  const businessTierLevel = Number(session.business.businessTierLevel || 1);
  const currentRole = session.business.currentRole || "owner";
  const isSettingsPage = pathname === "/dashboard/settings";
  const shouldBlockForCompliance = businessTierLevel < 2 && !isSettingsPage;
  const visibleNavItems = navItems.filter((item) => {
    if (
      ["/dashboard/accounts", "/dashboard/payment", "/dashboard/checkout", "/dashboard/transactions"].includes(
        item.href,
      )
    ) {
      return OWNER_ADMIN_ROLES.has(currentRole);
    }

    if (item.href === "/dashboard/developers") {
      return DEVELOPER_VISIBLE_ROLES.has(currentRole);
    }

    return true;
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] text-slate-900 lg:grid lg:h-screen lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-[100svh] w-[280px] flex-col bg-[var(--brand-panel)] text-white transition lg:static lg:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-22 items-center px-7 pb-2 pt-5">
          <Wordmark inverted />
        </div>

        <nav className="grid gap-1 px-2 pt-7">
          {visibleNavItems.map((item) => {
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
                  "group flex h-[52px] items-center gap-3 rounded-[8px] px-5 text-[15px] font-medium tracking-[0.01em] transition",
                  active
                    ? "bg-[image:var(--brand-panel-active)] text-white shadow-[0_16px_30px_rgba(37,150,190,0.24)]"
                    : "bg-transparent text-white/88 hover:bg-[var(--brand-panel-soft)] hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-[20px] w-[20px] transition-transform duration-300 group-hover:scale-110",
                    active
                      ? "animate-[sidebarIconFloat_3s_ease-in-out_infinite] text-white"
                      : "text-white/88 group-hover:-translate-y-0.5",
                  )}
                />
                <span className={active ? "text-white" : "text-white/88"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pb-5 pt-6">
          <div className="rounded-[8px] bg-[image:var(--brand-panel-active)] p-4 shadow-[0_20px_38px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--brand-panel)]">
                {getInitials(
                  session.business.businessName ||
                    session.business.contactFirstName ||
                    "A",
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-white">
                  {session.business.businessName || "Aris Merchant"}
                </p>
                <p className="truncate text-sm text-white/68">
                  {session.business.emailAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden"
          aria-label="Close menu"
        />
      ) : null}

      <div className="min-w-0 lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-[86px] items-center gap-3 border-b border-[var(--border)] bg-white px-4 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-500 lg:hidden"
          >
            <MenuIcon />
          </button>

          <div className="relative hidden w-full max-w-[360px] md:block">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />
            <input
              placeholder="Search by Name"
              className="h-12 w-full rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] pl-12 pr-4 text-sm font-medium text-slate-700 outline-none placeholder:text-[#8d99a8] focus:border-[var(--brand-soft-2)] focus:bg-white"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-5">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[var(--border)] bg-white text-[var(--brand)]"
            >
              <BellIcon />
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex h-[48px] items-center gap-3 bg-white transition"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f6f8] font-semibold text-[#344054]">
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f6f8] font-semibold text-[#344054]">
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
                        <p className="mt-2 text-xs font-medium capitalize text-[var(--brand)]">
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

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
          {title || actions ? (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {title ? (
                  <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#1f2937]">
                    {title}
                  </h1>
                ) : null}
                {title ? (
                  <p className="mt-2 text-sm text-[#98a2b3]">
                    Manage and monitor your Aris Pay workspace.
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
      {shouldBlockForCompliance ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[440px] rounded-[8px] bg-white p-5 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:p-7">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)]">
              <SettingsIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[20px] font-bold text-[#101828]">
              Verify your BVN to complete your account setup
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-[#667085]">
              Every new business starts on Tier 1 and cannot process
              transactions yet. Verify your BVN to move to Tier 2, create your
              settlement accounts instantly, and unlock transactions up to NGN
              10,000 per payment.
            </p>
            <div className="mt-5 rounded-[14px] border border-[#e4e7ec] bg-[#f8fafc] p-4 text-left">
              <div className="flex items-center justify-between border-b border-dashed border-[#d0d5dd] pb-3">
                <span className="text-sm font-semibold text-[#344054]">Tier 1</span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b42318]">
                  Locked
                </span>
              </div>
              <p className="mt-3 text-sm text-[#667085]">
                No transactions until BVN verification is completed.
              </p>
              <div className="mt-4 flex items-center justify-between border-b border-dashed border-[#d0d5dd] pb-3">
                <span className="text-sm font-semibold text-[#344054]">Tier 2</span>
                <span className="text-sm font-semibold text-[var(--brand-deep)]">NGN 10,000 max</span>
              </div>
              <p className="mt-3 text-sm text-[#667085]">
                BVN verified. Settlement accounts are created immediately.
              </p>
              <div className="mt-4 flex items-center justify-between pb-1">
                <span className="text-sm font-semibold text-[#344054]">Tier 3</span>
                <span className="text-sm font-semibold text-[var(--brand-deep)]">NGN 5,000,000 max</span>
              </div>
              <p className="mt-3 text-sm text-[#667085]">
                Upload your CAC document to unlock full business limits.
              </p>
            </div>
            <Button
              type="button"
              className="dashboard-black-button mt-7 w-full"
              onClick={() => {
                window.dispatchEvent(new Event("aris-pay:open-compliance"));
                router.replace("/dashboard/settings?tab=compliance");
              }}
            >
              Verify BVN
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
