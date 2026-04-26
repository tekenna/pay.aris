"use client";

import { useEffect, useMemo, useState } from "react";
import { DetailsDrawer } from "@/components/dashboard/details-drawer";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { merchantApi } from "@/lib/merchant-api";
import type { BusinessTransaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CheckoutTransactionsPage() {
  const { session } = useBusinessSession();
  const [data, setData] = useState<BusinessTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<BusinessTransaction | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      if (!session?.token) {
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(status ? { status } : {}),
      });

      const response = await merchantApi.getCheckoutTransactions(session.token, params);
      if (response.statusCode === 200) {
        setData(response.data);
        setPages(response.pagination?.pages || 1);
      }
    }

    void loadTransactions();
  }, [limit, page, session?.token, status]);

  const details = useMemo(
    () =>
      selected
        ? [
            { label: "Reference", value: selected.reference },
            { label: "Status", value: selected.status },
            { label: "Source", value: "API Checkout" },
            { label: "Session ID", value: selected.providerReference || selected.reference },
            { label: "Transaction Method", value: selected.paymentMethod || selected.channel || "Transfer" },
            { label: "Sender", value: selected.customer?.name || selected.customer?.email },
            { label: "Bank Name", value: selected.virtualAccount?.bankName },
            { label: "Account Number", value: selected.virtualAccount?.accountNumber },
            { label: "Narration", value: selected.narration },
            { label: "Paid At", value: formatDate(selected.paidAt) },
          ]
        : [],
    [selected],
  );

  return (
    <MerchantShell title="Checkout">
      <Card className="overflow-hidden p-7">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[18px] font-bold text-slate-950">Checkout Transactions</p>
            <p className="mt-2 text-sm text-[#667085]">
              Transactions received through the developer checkout API.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-3 text-[15px] font-medium text-[#98a2b3]">
              Sort by:
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="h-[45px] min-w-[148px] rounded-[6px] border border-[#d8dee6] bg-white px-5 text-[15px] font-medium text-[#98a2b3] outline-none"
              >
                <option value="">All</option>
                <option value="success">Completed</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
            </label>
            <Button className="dashboard-black-button h-[45px] rounded-[10px] px-7 text-[15px] font-bold">
              Export Statement
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
              <tr>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Transaction ID</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item._id}
                  className="cursor-pointer text-[15px] font-medium text-[#667085] hover:bg-slate-50"
                  onClick={() => setSelected(item)}
                >
                  <td className="px-4 py-7">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-7">{item.reference}</td>
                  <td className="px-4 py-7">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="px-4 py-7 text-right font-bold text-[#344054]">
                    {formatCurrency(item.amount, item.currency)}
                  </td>
                </tr>
              ))}
              {!data.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm text-slate-400">
                    No checkout transactions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          limit={limit}
          totalPages={pages}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </Card>

      <DetailsDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Checkout Transaction Details"
        amount={formatCurrency(selected?.amount, selected?.currency)}
        status={selected?.status || "pending"}
        timestamp={selected?.paidAt || selected?.createdAt}
        fields={details}
      />
    </MerchantShell>
  );
}
