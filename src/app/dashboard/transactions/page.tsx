"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DetailsDrawer } from "@/components/dashboard/details-drawer";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import {
  getTransactionCategory,
  getTransactionType,
  TransactionsTable,
} from "@/components/dashboard/transactions-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, type FilterItem } from "@/components/ui/Filter";
import { SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { downloadReceiptPdf } from "@/lib/receipt-pdf";
import type { BusinessTransaction } from "@/lib/types";
import { downloadCsvFile, formatCurrency, formatDate } from "@/lib/utils";
import { useBusinessSession } from "@/store/business-session-provider";
import { transactionsService } from "@/services/transactions.service";

export default function TransactionsPage() {
  const { session } = useBusinessSession();
  const [data, setData] = useState<BusinessTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<BusinessTransaction | null>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
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
          { label: "Failed", value: "failed" },
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

      const response = await transactionsService.getTransactions(
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
            { label: "Type", value: getTransactionType(selected) },
            { label: "Balance", value: formatCurrency(selected.balanceAfter, selected.currency) },
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
  const filteredTransactions = useMemo(() => {
    const pattern = searchTerm.trim().toLowerCase();
    if (!pattern) {
      return data;
    }

    return data.filter((item) =>
      [
        item.reference,
        item.narration,
        item.customer?.name,
        item.customer?.email,
        item.virtualAccount?.accountNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(pattern)),
    );
  }, [data, searchTerm]);

  const selectedTransactionType = selected ? getTransactionType(selected) : "credit";
  const receiptRecipientName = selected
    ? selectedTransactionType === "debit"
      ? selected.virtualAccount?.accountName ||
        selected.customer?.name ||
        "Recipient"
      : selected.virtualAccount?.accountName ||
        session?.business.businessName ||
        "Aris Pay Merchant"
    : "--";
  const receiptBankName = selected
    ? selectedTransactionType === "debit"
      ? selected.virtualAccount?.bankName || "--"
      : selected.virtualAccount?.bankName ||
        session?.business.safehaven?.bankName ||
        "Aris Pay"
    : "--";
  const receiptAccountNumber = selected
    ? selected.virtualAccount?.accountNumber || "--"
    : "--";
  const receiptSourceBankName = selected
    ? selectedTransactionType === "debit"
      ? session?.business.safehaven?.bankName ||
        session?.business.safehavenCheckout?.bankName ||
        "Aris Pay"
      : selected.payload?.bankName?.toString() ||
        selected.customer?.name ||
        "Customer"
    : "--";
  const receiptSourceAccountName = selected
    ? selectedTransactionType === "debit"
      ? selected.customer?.name ||
        selected.customer?.email ||
        session?.business.safehaven?.accountNumber ||
        "--"
      : selected.customer?.name ||
        selected.customer?.email ||
        "Customer"
    : "--";
  const receiptSourceAccountNumber = selected
    ? selectedTransactionType === "debit"
      ? session?.business.safehaven?.accountNumber ||
        session?.business.safehavenCheckout?.accountNumber ||
        "--"
      : selected.customer?.accountNumber || "--"
    : "--";

  async function handleDownloadReceipt() {
    if (!selected) {
      return;
    }

    setIsDownloadingReceipt(true);
    try {
      await downloadReceiptPdf(
        {
          amount: selected.amount,
          paidAt: selected.paidAt || selected.createdAt,
          status: selected.status,
          sessionId: selected.providerReference || selected.reference,
          recipientName: receiptRecipientName,
          bankName: receiptBankName,
          accountNumber: receiptAccountNumber,
          sourceBankName: receiptSourceBankName,
          sourceAccountNumber: receiptSourceAccountNumber,
          sourceAccountName: receiptSourceAccountName,
          narration: selected.narration || selected.reference,
        },
        `${selected.reference}-receipt.pdf`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to download receipt.",
      );
    } finally {
      setIsDownloadingReceipt(false);
    }
  }

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
      const response = await transactionsService.getTransactions(
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
          "Type",
          "Narration",
          "Amount",
          "Balance",
        ],
        ...response.data.map((item) => [
          formatDate(item.createdAt),
          item.reference,
          item.status,
          getTransactionCategory(item),
          getTransactionType(item),
          item.narration || "--",
          String(item.amount ?? ""),
          String(item.balanceAfter ?? ""),
        ]),
      ];

      downloadCsvFile("aris-pay-transactions-statement.csv", rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export statement.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <MerchantShell title="Transactions">
      <div className="mb-5 inline-flex rounded-[8px] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-soft)]">
        <span className="inline-flex h-11 items-center rounded-[6px] bg-[var(--brand)] px-6 text-sm font-semibold text-white">
          Transaction Ledger
        </span>
      </div>

      <Card className="dashboard-surface-card overflow-hidden p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
              All Transactions
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              Review payments, fees, settlements, and checkout activity in one place.
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
        <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by reference, narration, customer, or account"
              leftIcon={<SearchIcon className="h-4 w-4" />}
              fieldSize="lg"
              className="w-full md:max-w-[380px]"
            />
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
          <p className="text-sm text-[#98a2b3]">
            Showing {filteredTransactions.length} transaction
            {filteredTransactions.length === 1 ? "" : "s"} on this page
          </p>
        </div>
        <TransactionsTable
          transactions={filteredTransactions}
          emptyMessage="No business transactions match this filter."
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
        title="Transaction Details"
        amount={formatCurrency(selected?.amount, selected?.currency)}
        status={selected?.status || "pending"}
        timestamp={selected?.paidAt || selected?.createdAt}
        fields={details}
        primaryActionLabel="Download Receipt"
        onPrimaryAction={() => void handleDownloadReceipt()}
        primaryActionLoading={isDownloadingReceipt}
        secondaryActionLabel="Close"
        onSecondaryAction={() => setSelected(null)}
      />
    </MerchantShell>
  );
}
