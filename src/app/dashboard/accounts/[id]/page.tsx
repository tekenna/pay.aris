"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowDownLeftIcon, ArrowUpRightIcon, ChevronLeft } from "@/components/ui/icons";
import type { BusinessAccountLedgerEntry, BusinessSettlementAccount } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useBusinessSession } from "@/store/business-session-provider";
import { accountsService } from "@/services/accounts.service";

export default function AccountDetailsPage() {
  const params = useParams<{ id: string }>();
  const { session } = useBusinessSession();
  const [account, setAccount] = useState<BusinessSettlementAccount | null>(null);
  const [ledger, setLedger] = useState<BusinessAccountLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadAccount() {
      if (!session?.token || !params?.id) {
        return;
      }

      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const response = await accountsService.getAccountById(
        session.token,
        params.id,
        searchParams,
      );
      if (response.statusCode === 200) {
        setAccount(response.data.account);
        setLedger(response.data.ledger);
        setTotalPages(response.pagination?.pages || 1);
      }
    }

    void loadAccount();
  }, [limit, page, params?.id, session?.token]);

  const accountTitle = useMemo(() => {
    if (!account) return "Account";
    if (account.kind === "checkout") return "Checkout Account";
    if (account.kind === "primary") return "Primary Settlement Account";
    return "Settlement Account";
  }, [account]);

  return (
    <MerchantShell title="Account Details">
      <Link href="/dashboard/accounts" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <Card className="border-[#eef1f5] bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">{accountTitle}</p>
            <h1 className="mt-3 text-[28px] font-bold text-[#101828]">{account?.accountName || "--"}</h1>
            <p className="mt-2 text-sm text-[#667085]">
              {account?.accountNumber || "--"} • {account?.bankName || "Safehaven MFB"}
            </p>
          </div>

          <div className="rounded-[18px] bg-[#f8fafb] px-6 py-5 text-right">
            <p className="text-sm font-medium text-[#667085]">Available Balance</p>
            <p className="mt-2 text-[30px] font-bold text-[#101828]">
              {formatCurrency(account?.balance || 0, account?.currency || "NGN")}
            </p>
            <div className="mt-3 flex justify-end">
              <StatusBadge value={account?.status || "active"} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-8 overflow-hidden p-5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[18px] font-bold text-slate-950">Account Transactions</p>
            <p className="mt-1 text-sm text-slate-500">All credits and debits that have happened on this account.</p>
          </div>
          <Link
            href="/dashboard/accounts/withdraw"
            className="dashboard-black-button inline-flex h-10 items-center justify-center rounded-[10px] px-5 text-sm font-semibold text-white"
          >
            Withdraw
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
              <tr>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Counterparty</th>
                <th className="px-4 py-4">Reference</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-4 py-5">
                    <div className="inline-flex items-center gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                          entry.type === "credit" ? "bg-[#e8f6ef] text-[#12b76a]" : "bg-[#fff1f3] text-[#f04438]"
                        }`}
                      >
                        {entry.type === "credit" ? (
                          <ArrowDownLeftIcon className="h-4 w-4" />
                        ) : (
                          <ArrowUpRightIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          entry.type === "credit" ? "bg-[#e8f6ef] text-[#0a9550]" : "bg-[#fff4e5] text-[#b54708]"
                        }`}
                      >
                        {entry.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="font-semibold text-[#101828]">{entry.counterpartyName || "--"}</p>
                    <p className="mt-1 text-xs text-[#667085]">
                      {entry.counterpartyAccountNumber || "--"}{entry.counterpartyBankName ? ` • ${entry.counterpartyBankName}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-5 text-[#344054]">{entry.reference}</td>
                  <td className="px-4 py-5">
                    <p className={`font-semibold ${entry.type === "credit" ? "text-[#12b76a]" : "text-[#f04438]"}`}>
                      {entry.type === "debit" ? "- " : ""}
                      {formatCurrency(Math.abs(entry.amount))}
                    </p>
                    {entry.fee ? <p className="mt-1 text-xs text-[#98a2b3]">Fee: {formatCurrency(entry.fee)}</p> : null}
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge value={entry.status} />
                  </td>
                  <td className="px-4 py-5 text-[#667085]">{formatDateTime(entry.paidAt || entry.createdAt)}</td>
                </tr>
              ))}
              {!ledger.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-400">
                    No transactions have happened on this account yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </Card>
    </MerchantShell>
  );
}
