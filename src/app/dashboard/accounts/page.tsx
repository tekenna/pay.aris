"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { merchantApi } from "@/lib/merchant-api";
import type { Business } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type LocalSettlementAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  status: string;
};

export default function AccountsPage() {
  const { session } = useBusinessSession();
  const [profile, setProfile] = useState<Business | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await merchantApi.getProfile(session.token);
      if (response.statusCode === 200) {
        setProfile(response.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadProfile();
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [loadProfile]);

  const accounts = useMemo(() => {
    const current: LocalSettlementAccount[] = [];

    if (profile?.kyc?.settlementAccountNumber) {
      current.push({
        id: "primary",
        bankName: profile.safehaven?.bankName || "Safehaven MFB",
        accountNumber: profile.kyc.settlementAccountNumber,
        accountName:
          profile.kyc.settlementAccountName || profile.businessName || "Settlement account",
        balance: Number(
          profile.safehaven?.meta?.availableBalance ??
            profile.safehaven?.meta?.balance ??
            0,
        ),
        currency: "NGN",
        status: profile.safehaven?.status || "active",
      });
    }

    if (profile?.safehavenCheckout?.accountNumber) {
      current.push({
        id: "checkout",
        bankName: profile.safehavenCheckout.bankName || "Safehaven MFB",
        accountNumber: profile.safehavenCheckout.accountNumber,
        accountName:
          profile.safehavenCheckout.accountName ||
          `${profile.businessName || "Business"} Checkout`,
        balance: Number(
          profile.safehavenCheckout?.meta?.availableBalance ??
            profile.safehavenCheckout?.meta?.balance ??
            0,
        ),
        currency: "NGN",
        status: profile.safehavenCheckout.status || "active",
      });
    }

    return current;
  }, [profile]);
  const mainAccountBalance = Number(
    profile?.safehaven?.meta?.availableBalance ??
      profile?.safehaven?.meta?.balance ??
      0,
  );
  const checkoutAccountBalance = Number(
    profile?.safehavenCheckout?.meta?.availableBalance ??
      profile?.safehavenCheckout?.meta?.balance ??
      0,
  );
  const totalAvailableBalance = mainAccountBalance + checkoutAccountBalance;
  const mainAccountName =
    profile?.safehaven?.accountName ||
    profile?.kyc?.settlementAccountName ||
    profile?.businessName ||
    "Main Account";
  const checkoutAccountName =
    profile?.safehavenCheckout?.accountName ||
    `${profile?.businessName || "Business"} Checkout`;

  return (
    <MerchantShell title="Accounts">
      <Card className="wallet-balance-gradient overflow-hidden border-0 px-10 py-10 text-white shadow-none">
        <div className="mb-12">
          <span className="inline-flex h-7 items-center rounded-[4px] bg-[#e6f7eb] px-3 text-sm font-semibold text-[#00884f]">
            Wallet Balance
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-[13px] font-medium uppercase text-white/82">
              Total Available Balance
            </p>
            <p className="mt-2 text-[48px] font-bold leading-none tracking-[0.01em]">
              {formatCurrency(totalAvailableBalance)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void loadProfile()}
              disabled={isRefreshing}
              className="h-[48px] min-w-[128px] rounded-[8px] border border-white/30 bg-white/10 text-[15px] font-bold text-white hover:bg-white/15 disabled:opacity-70"
            >
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Button
              type="button"
              className="dashboard-soft-green-button h-[48px] min-w-[156px] rounded-[8px] text-[16px] font-bold"
            >
              Withdraw
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <div className="wallet-stat-gradient min-w-[194px] px-5 py-4">
            <p className="text-[11px] font-medium uppercase text-white/78">
              {mainAccountName}
            </p>
            <p className="mt-2 text-[20px] font-bold tracking-[0.04em]">
              {formatCurrency(mainAccountBalance)}
            </p>
          </div>
          <div className="wallet-stat-gradient min-w-[194px] px-5 py-4">
            <p className="text-[11px] font-medium uppercase text-white/78">
              {checkoutAccountName}
            </p>
            <p className="mt-2 text-[20px] font-bold tracking-[0.04em]">
              {formatCurrency(checkoutAccountBalance)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-10 overflow-hidden p-5">
        <div className="mb-8">
          <p className="text-[18px] font-bold text-slate-950">
            Settlement Accounts
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
              <tr>
                <th className="px-4 py-4">Bank Name</th>
                <th className="px-4 py-4">Account Name</th>
                <th className="px-4 py-4">Account Number</th>
                <th className="px-4 py-4">Balance</th>
                <th className="px-4 py-4">Currency</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-slate-100 text-[#101828]">
                  <td className="px-4 py-6 font-medium">{account.bankName}</td>
                  <td className="px-4 py-6">{account.accountName}</td>
                  <td className="px-4 py-6">{account.accountNumber}</td>
                  <td className="px-4 py-6 font-semibold text-[#344054]">
                    {formatCurrency(account.balance, account.currency)}
                  </td>
                  <td className="px-4 py-6">
                    <span className="inline-flex h-6 items-center rounded-full bg-[#e8f8ee] px-3 text-xs font-bold text-[#00884f]">
                      {account.currency}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <StatusBadge value={account.status} />
                  </td>
                  <td className="px-4 py-6 text-right text-xl font-bold text-[#667085]">
                    ⋮
                  </td>
                </tr>
              ))}
              {!accounts.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-sm text-slate-400">
                    No settlement account found yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

    </MerchantShell>
  );
}
