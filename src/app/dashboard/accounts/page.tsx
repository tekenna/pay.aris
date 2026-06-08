"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Business, BusinessSettlementAccount } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { accountsService } from "@/services/accounts.service";

export default function AccountsPage() {
  const { session } = useBusinessSession();
  const [profile, setProfile] = useState<Business | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await accountsService.getProfile(session.token);
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

  const accounts = useMemo<BusinessSettlementAccount[]>(
    () => profile?.settlementAccounts ?? [],
    [profile?.settlementAccounts],
  );
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
  const totalAvailableBalance = accounts.reduce(
    (total, account) => total + Number(account.balance ?? 0),
    0,
  );
  const currentRole = (session?.business.currentRole || "owner").toLowerCase();
  const canWithdraw = currentRole === "owner" || currentRole === "admin";
  const mainAccountName =
    profile?.safehaven?.accountName ||
    profile?.kyc?.settlementAccountName ||
    profile?.businessName ||
    "Main Account";
  const checkoutAccountName =
    profile?.safehavenCheckout?.accountName ||
    `${profile?.businessName || "Business"} Checkout`;

  async function handleCreateAccount() {
    if (!session?.token) {
      return;
    }

    const accountName = newAccountName.trim();
    if (!accountName) {
      toast.error("Enter an account name.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const response = await accountsService.createSettlementAccount(session.token, {
        accountName,
      });

      if (response.statusCode !== 200 && response.statusCode !== 201) {
        toast.error(response.message || "Unable to create account.");
        return;
      }

      toast.success("Settlement account created.");
      setCreateModalOpen(false);
      setNewAccountName("");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsCreatingAccount(false);
    }
  }

  return (
    <MerchantShell title="Accounts">
      <div className="mb-5 inline-flex rounded-[8px] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-soft)]">
        <span className="inline-flex h-11 items-center rounded-[6px] bg-[var(--brand)] px-6 text-sm font-semibold text-white">
          Settlement Accounts
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <Card className="dashboard-surface-card p-6">
          <p className="text-sm font-medium text-[#98a2b3]">
            Total Available Balance
          </p>
          <p className="mt-3 text-[36px] font-semibold tracking-[-0.03em] text-[#101828]">
            {formatCurrency(totalAvailableBalance)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void loadProfile()}
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            {canWithdraw ? (
              <Link
                href="/dashboard/accounts/withdraw"
                className="inline-flex h-11 min-w-[136px] items-center justify-center rounded-[6px] bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,150,190,0.18)]"
              >
                Withdraw
              </Link>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
            >
              Add account
            </Button>
          </div>
        </Card>

        <Card className="dashboard-surface-card p-6">
          <p className="text-sm font-medium text-[#98a2b3]">Primary Account</p>
          <p className="mt-3 truncate text-[20px] font-semibold text-[#101828]">
            {mainAccountName}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {profile?.kyc?.settlementAccountNumber || "--"}
          </p>
          <p className="mt-5 text-[28px] font-semibold tracking-[-0.02em] text-[#101828]">
            {formatCurrency(mainAccountBalance)}
          </p>
        </Card>

        <Card className="dashboard-surface-card p-6">
          <p className="text-sm font-medium text-[#98a2b3]">Checkout Account</p>
          <p className="mt-3 truncate text-[20px] font-semibold text-[#101828]">
            {checkoutAccountName}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {profile?.safehavenCheckout?.accountNumber || "--"}
          </p>
          <p className="mt-5 text-[28px] font-semibold tracking-[-0.02em] text-[#101828]">
            {formatCurrency(checkoutAccountBalance)}
          </p>
        </Card>
      </div>

      <Card className="dashboard-surface-card mt-6 overflow-hidden p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
              Account Directory
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              Review all provisioned settlement accounts and open each ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#98a2b3]">
              {accounts.length} account{accounts.length === 1 ? "" : "s"} available
            </p>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(true)}>
              Add account
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#eef2f6] text-[12px] font-semibold text-[#101828]">
              <tr>
                <th className="px-6 py-5">Bank Name</th>
                <th className="px-6 py-5">Account Name</th>
                <th className="px-6 py-5">Account Number</th>
                <th className="px-6 py-5">Balance</th>
                <th className="px-6 py-5">Currency</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="text-[#101828]">
                  <td colSpan={7} className="p-0">
                    <Link
                      href={`/dashboard/accounts/${account.id}`}
                      className="grid min-h-[78px] items-center border-b border-[var(--border)] px-6 text-left transition hover:bg-[#fbfcfd] md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.8fr_0.7fr_40px]"
                    >
                      <span className="py-6 font-medium">{account.bankName}</span>
                      <span className="py-6">{account.accountName}</span>
                      <span className="py-6">{account.accountNumber}</span>
                      <span className="py-6 font-semibold text-[#344054]">
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                      <span className="py-6">
                        <span className="inline-flex h-8 items-center rounded-[6px] bg-[var(--brand-soft)] px-3 text-xs font-bold text-[var(--brand-deep)]">
                          {account.currency}
                        </span>
                      </span>
                      <span className="py-6">
                        <StatusBadge value={account.status} />
                      </span>
                      <span className="py-6 text-right text-xl font-bold text-[#667085]">
                        ›
                      </span>
                    </Link>
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

      <Modal
        open={createModalOpen}
        onClose={() => {
          if (isCreatingAccount) return;
          setCreateModalOpen(false);
        }}
        title="Add settlement account"
        description="Create another Safehaven-backed settlement account and give it a name your team will recognize."
        maxWidthClassName="max-w-lg"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateAccount();
          }}
        >
          <Input
            label="Account name"
            placeholder="Projects Wallet"
            value={newAccountName}
            onChange={(event) => setNewAccountName(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={isCreatingAccount}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreatingAccount}>
              Create account
            </Button>
          </div>
        </form>
      </Modal>
    </MerchantShell>
  );
}
