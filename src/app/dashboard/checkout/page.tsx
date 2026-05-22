"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DetailsDrawer } from "@/components/dashboard/details-drawer";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, type FilterItem } from "@/components/ui/Filter";
import { Pagination } from "@/components/ui/pagination";
import {
  getTransactionCategory,
  TransactionsTable,
} from "@/components/dashboard/transactions-table";
import type { BusinessTransaction } from "@/lib/types";
import { downloadCsvFile, formatCurrency, formatDate } from "@/lib/utils";
import { transactionsService } from "@/services/transactions.service";

export default function CheckoutTransactionsPage() {
  const { session } = useBusinessSession();
  const [data, setData] = useState<BusinessTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<BusinessTransaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filterItems = useMemo<FilterItem[]>(
    () => [
      {
        title: "By Status",
        type: "checkbox",
        selectionMode: "single",
        values: [
          { label: "Success", value: "success" },
          { label: "Pending", value: "pending" },
          { label: "Active", value: "active" },
          { label: "Failed", value: "failed" },
          { label: "Expired", value: "expired" },
        ],
        selected: status ? [status] : [],
      },
      {
        title: "By Date Range",
        type: "date-range",
        selected: dateFrom || dateTo ? [dateFrom, dateTo].filter(Boolean) : [],
      },
    ],
    [dateFrom, dateTo, status],
  );

  useEffect(() => {
    async function loadTransactions() {
      if (!session?.token) {
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(status ? { status } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });

      const response = await transactionsService.getCheckoutTransactions(
        session.token,
        params,
      );
      if (response.statusCode === 200) {
        setData(response.data);
        setPages(response.pagination?.pages || 1);
      }
    }

    void loadTransactions();
  }, [dateFrom, dateTo, limit, page, session?.token, status]);

  const details = useMemo(
    () =>
      selected
        ? [
            { label: "Reference", value: selected.reference },
            { label: "Status", value: selected.status },
            { label: "Category", value: getTransactionCategory(selected) },
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

  async function handleExportStatement() {
    if (!session?.token) {
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
        ...(status ? { status } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });
      const response = await transactionsService.getCheckoutTransactions(
        session.token,
        params,
      );
      if (response.statusCode !== 200) {
        toast.error(response.message || "Unable to export statement.");
        return;
      }

      const rows = [
        [
          "Date",
          "Reference",
          "Status",
          "Category",
          "Source",
          "Narration",
          "Amount",
        ],
        ...response.data.map((item) => [
          formatDate(item.createdAt),
          item.reference,
          item.status,
          getTransactionCategory(item),
          "API Checkout",
          item.narration || "--",
          String(item.amount ?? ""),
        ]),
      ];

      downloadCsvFile("aris-pay-checkout-statement.csv", rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export statement.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <MerchantShell title="Checkout">
      <Card className="dashboard-surface-card overflow-hidden p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
              API Checkout Transactions
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              Transactions created when merchants integrate using their API keys.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="min-w-[156px]"
              loading={isExporting}
              onClick={() => void handleExportStatement()}
            >
              Export Statement
            </Button>
          </div>
        </div>
        <div className="mb-6 flex items-center justify-end">
          <Filter
            filterItems={filterItems}
            onChange={(items) => {
              const statusItem = items.find((item) => item.title === "By Status");
              const dateRangeItem = items.find((item) => item.title === "By Date Range");

              setStatus(statusItem?.selected?.[0] ?? "");
              setDateFrom(dateRangeItem?.selected?.[0] ?? "");
              setDateTo(dateRangeItem?.selected?.[1] ?? "");
              setPage(1);
            }}
          />
        </div>
        <TransactionsTable
          transactions={data}
          emptyMessage="No API checkout transactions yet."
          onRowClick={setSelected}
        />
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
