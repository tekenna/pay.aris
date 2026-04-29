"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { QrCode } from "@/components/ui/qr-code";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ChevronLeft,
  PaymentIcon,
  ScanIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { merchantApi } from "@/lib/merchant-api";
import type { BusinessTransaction, CheckoutSession } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type PaymentTab = "links" | "qr";
type DrawerMode = "create" | "edit";
type PaymentDetailsTab = "details" | "transactions";

type PaymentForm = {
  paymentType: "one_time" | "multiple";
  name: string;
  amount: string;
  expires: boolean;
  expiryDate: string;
};

const paymentTypeLabel = {
  one_time: "One Time",
  multiple: "Multiple",
};

function formatAmountInput(value: string) {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  const hasDecimal = dotIndex !== -1;
  const integerPart = hasDecimal ? cleaned.slice(0, dotIndex) : cleaned;
  const decimalPart = hasDecimal
    ? cleaned
        .slice(dotIndex + 1)
        .replace(/\./g, "")
        .slice(0, 2)
    : "";
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (hasDecimal) {
    return `${formattedInteger || "0"}.${decimalPart}`;
  }

  return formattedInteger;
}

function parseAmountInput(value: string) {
  return Number(value.replace(/,/g, ""));
}

function getPaymentName(session: CheckoutSession) {
  return session.description || "Aris Contribution";
}

function getPaymentUrl(session: CheckoutSession) {
  return session.checkoutUrl || `https://checkout.ariswallex.com/${session.reference}`;
}

function getPaymentType(session: CheckoutSession) {
  return session.paymentType || "one_time";
}

function getPaymentStatusLabel(session: CheckoutSession) {
  if (session.status === "inactive") return "Inactive";
  if (session.status === "active") return "Active";
  if (session.status === "success") return "Paid";
  return session.status || "unknown";
}

function PaymentKindIcon({ tab }: { tab: PaymentTab }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5f6ed] text-[#00884f]">
      {tab === "links" ? (
        <PaymentIcon className="h-5 w-5" />
      ) : (
        <ScanIcon className="h-5 w-5" />
      )}
    </span>
  );
}

function PaymentTabs({
  value,
  onChange,
}: {
  value: PaymentTab;
  onChange: (value: PaymentTab) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[
        { label: "Links", value: "links" as const },
        { label: "QR Code", value: "qr" as const },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`h-10 rounded-[6px] px-4 text-sm font-bold ${
            value === item.value
              ? "bg-[#e5f6ed] text-[#00884f]"
              : "text-[#667085]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function buildFormState(session?: CheckoutSession | null): PaymentForm {
  return {
    paymentType: (session?.paymentType as "one_time" | "multiple") || "multiple",
    name: session?.description || "",
    amount: session?.amount ? formatAmountInput(String(session.amount)) : "",
    expires: Boolean(session?.linkExpires),
    expiryDate: session?.linkExpiresAt ? String(session.linkExpiresAt).slice(0, 10) : "",
  };
}

export default function PaymentPage() {
  const { session } = useBusinessSession();
  const [data, setData] = useState<CheckoutSession[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [tab, setTab] = useState<PaymentTab>("links");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<CheckoutSession | null>(null);
  const [detailsTab, setDetailsTab] = useState<PaymentDetailsTab>("details");
  const [paymentTransactions, setPaymentTransactions] = useState<BusinessTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [transactionPages, setTransactionPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [isSaving, setIsSaving] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(buildFormState());

  useEffect(() => {
    async function loadSessions() {
      if (!session?.token) {
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("searchTerm", searchTerm.trim());
      }

      const response = await merchantApi.getPayments(session.token, params);
      if (response.statusCode === 200) {
        setData(response.data);
        setPages(response.pagination?.pages || 1);
      }
    }

    void loadSessions();
  }, [limit, page, searchTerm, session?.token]);

  const filteredData = useMemo(() => {
    if (tab === "links") {
      return data;
    }

    return data.filter((item) => Boolean(item.virtualAccount?.accountNumber));
  }, [data, tab]);

  const paymentDetails = useMemo(
    () =>
      selectedPayment
        ? [
            { label: "Status", value: getPaymentStatusLabel(selectedPayment) },
            { label: "Reference", value: selectedPayment.reference },
            { label: "Payment Type", value: paymentTypeLabel[getPaymentType(selectedPayment)] },
            { label: "Amount", value: selectedPayment.amount ? formatCurrency(selectedPayment.amount, selectedPayment.currency) : "Customer enters amount" },
            { label: "Checkout URL", value: getPaymentUrl(selectedPayment) },
            { label: "Link Expiry", value: formatDateTime(selectedPayment.linkExpiresAt) },
            { label: "Activated At", value: formatDateTime(selectedPayment.activatedAt) },
            { label: "Paid At", value: formatDateTime(selectedPayment.paidAt) },
            { label: "Created At", value: formatDateTime(selectedPayment.createdAt) },
            ...(selectedPayment.paymentType === "multiple"
              ? []
              : [
                  { label: "Virtual Account", value: selectedPayment.virtualAccount?.accountNumber || "--" },
                  { label: "Account Name", value: selectedPayment.virtualAccount?.accountName || "--" },
                  { label: "Bank Name", value: selectedPayment.virtualAccount?.bankName || "--" },
                  { label: "Virtual Account Expiry", value: formatDateTime(selectedPayment.virtualAccount?.expiresAt) },
                ]),
          ]
        : [],
    [selectedPayment],
  );

  useEffect(() => {
    async function loadPaymentTransactions() {
      if (!session?.token || !selectedPayment?._id || selectedPayment.paymentType !== "multiple") {
        setPaymentTransactions([]);
        setTransactionPages(1);
        return;
      }

      setLoadingTransactions(true);
      try {
        const params = new URLSearchParams({
          checkoutSessionId: selectedPayment._id,
          page: String(transactionPage),
          limit: String(transactionLimit),
        });
        const response = await merchantApi.getTransactions(session.token, params);
        if (response.statusCode === 200) {
          setPaymentTransactions(response.data);
          setTransactionPages(response.pagination?.pages || 1);
        }
      } finally {
        setLoadingTransactions(false);
      }
    }

    void loadPaymentTransactions();
  }, [
    selectedPayment?._id,
    selectedPayment?.paymentType,
    session?.token,
    transactionLimit,
    transactionPage,
  ]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingSessionId(null);
    setForm(buildFormState());
    setDrawerOpen(true);
  }

  function openEditDrawer(payment: CheckoutSession) {
    setDrawerMode("edit");
    setEditingSessionId(payment._id);
    setForm(buildFormState(payment));
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!session?.token) {
      return;
    }

    setIsSaving(true);
    try {
      const amount = parseAmountInput(form.amount);
      const payload = {
        paymentType: form.paymentType,
        description: form.name || undefined,
        amount: amount > 0 ? amount : undefined,
        expires: form.paymentType === "multiple" ? form.expires : false,
        expiresAt:
          form.paymentType === "multiple" && form.expires && form.expiryDate
            ? new Date(form.expiryDate).toISOString()
            : null,
      };

      const response =
        drawerMode === "create"
          ? await merchantApi.createPaymentLink(session.token, payload)
          : await merchantApi.updatePaymentLink(session.token, editingSessionId!, payload);

      if (response.statusCode !== 200 && response.statusCode !== 201) {
        toast.error(response.message || "Unable to save payment link.");
        return;
      }

      const nextSession: CheckoutSession =
        drawerMode === "create" && "session" in response.data && response.data.session
          ? response.data.session
          : (response.data as CheckoutSession);

      setData((current) => {
        if (drawerMode === "create") {
          return [nextSession, ...current];
        }

        return current.map((item) => (item._id === nextSession._id ? nextSession : item));
      });

      if (selectedPayment?._id === nextSession._id) {
        setSelectedPayment(nextSession);
      }

      toast.success(
        drawerMode === "create" ? "Payment link generated." : "Payment link updated.",
      );
      setDrawerOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save payment link.");
    } finally {
      setIsSaving(false);
    }
  }

  if (selectedPayment) {
    const isMultiplePayment = selectedPayment.paymentType === "multiple";

    return (
      <MerchantShell title="">
        <button
          type="button"
          onClick={() => {
            setSelectedPayment(null);
            setDetailsTab("details");
            setTransactionPage(1);
          }}
          className="-mt-6 mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#344054]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <Card className="mb-7 flex flex-wrap items-center justify-between gap-4 p-7">
          <div className="flex items-center gap-4">
            <PaymentKindIcon tab={tab} />
            <div>
              <p className="text-[18px] font-bold text-[#202939]">
                {getPaymentName(selectedPayment)}
              </p>
              <p className="mt-2 text-[15px] font-medium text-[#667085] break-all">
                {getPaymentUrl(selectedPayment)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-[8px] px-5 text-sm font-bold"
            onClick={() => openEditDrawer(selectedPayment)}
          >
            Edit Link
          </Button>
        </Card>

        <Card className="p-7">
          {isMultiplePayment ? (
            <div className="mb-8 flex items-center gap-2 rounded-[12px] bg-[#f8fafc] p-2">
              {[
                { label: "Details", value: "details" as const },
                { label: "Transactions", value: "transactions" as const },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDetailsTab(item.value);
                    if (item.value === "transactions") {
                      setTransactionPage(1);
                    }
                  }}
                  className={`h-10 rounded-[10px] px-4 text-sm font-bold transition ${
                    detailsTab === item.value
                      ? "bg-white text-[#111827] shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                      : "text-[#667085]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_280px]">
            <div className="min-w-0">
              <div className="mb-6 flex flex-wrap gap-2">
                <StatusBadge value={getPaymentStatusLabel(selectedPayment)} />
                {selectedPayment.virtualAccount?.accountNumber ? (
                  <StatusBadge value="QR Ready" />
                ) : null}
              </div>

              <div className="mb-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] bg-[#0f172a] p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/60">
                    Amount
                  </p>
                  <p className="mt-3 text-[26px] font-bold leading-none">
                    {selectedPayment.amount
                      ? formatCurrency(selectedPayment.amount, selectedPayment.currency)
                      : "Variable"}
                  </p>
                </div>
                <div className="rounded-[16px] bg-[#f8fafc] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                    Payment Status
                  </p>
                  <div className="mt-3">
                    <StatusBadge value={getPaymentStatusLabel(selectedPayment)} />
                  </div>
                </div>
                <div className="rounded-[16px] bg-[#f8fafc] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                    Payment Date
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#202939]">
                    {formatDateTime(selectedPayment.paidAt || selectedPayment.createdAt)}
                  </p>
                </div>
              </div>

              {detailsTab === "details" || !isMultiplePayment ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentDetails.map((item) => (
                    <div key={item.label} className="rounded-[12px] bg-[#f8fafc] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#202939] break-words">
                        {item.value || "--"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {detailsTab === "transactions" && isMultiplePayment ? (
                <div className="overflow-hidden rounded-[18px] border border-[#e4e7ec]">
                  <div className="border-b border-[#e4e7ec] bg-[#f8fafc] px-5 py-4">
                    <p className="text-sm font-bold text-[#111827]">
                      Transactions
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">
                      Every successful payment attempt created from this reusable payment link.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white text-[11px] uppercase tracking-[0.12em] text-[#98a2b3]">
                        <tr>
                          <th className="px-5 py-4">Date</th>
                          <th className="px-5 py-4">Reference</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentTransactions.map((item) => (
                          <tr key={item._id} className="border-t border-[#f2f4f7] text-[#475467]">
                            <td className="px-5 py-4">{formatDateTime(item.paidAt || item.createdAt)}</td>
                            <td className="px-5 py-4 font-medium text-[#111827]">{item.reference}</td>
                            <td className="px-5 py-4">
                              <StatusBadge value={item.status} />
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-[#111827]">
                              {formatCurrency(item.amount, item.currency)}
                            </td>
                          </tr>
                        ))}
                        {!paymentTransactions.length && !loadingTransactions ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-sm text-[#98a2b3]">
                              No transactions recorded for this payment link yet.
                            </td>
                          </tr>
                        ) : null}
                        {loadingTransactions ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-sm text-[#98a2b3]">
                              Loading transactions...
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-[#e4e7ec] bg-white px-5 py-4">
                    <Pagination
                      page={transactionPage}
                      limit={transactionLimit}
                      totalPages={transactionPages}
                      onPageChange={setTransactionPage}
                      onLimitChange={(nextLimit) => {
                        setTransactionLimit(nextLimit);
                        setTransactionPage(1);
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="rounded-[20px] border border-[#e4e7ec] bg-[#f8fafc] p-5 xl:sticky xl:top-6 xl:self-start">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                    Payment QR
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#667085]">
                    Customers can scan this code to open the payment link directly.
                  </p>
                </div>
                <StatusBadge value={selectedPayment.virtualAccount?.accountNumber ? "Live" : "Ready"} />
              </div>
              <div className="mt-6 flex justify-center">
                <QrCode value={getPaymentUrl(selectedPayment)} size={220} />
              </div>
            </aside>
          </div>
        </Card>

        <PaymentLinkDrawer
          open={drawerOpen}
          mode={drawerMode}
          tab={tab}
          form={form}
          isSaving={isSaving}
          onTabChange={setTab}
          onClose={() => setDrawerOpen(false)}
          onFormChange={setForm}
          onSave={handleSave}
        />
      </MerchantShell>
    );
  }

  return (
    <MerchantShell
      title="Payments"
      actions={
        <Button
          type="button"
          onClick={openCreateDrawer}
          className="dashboard-black-button h-10 rounded-[10px] px-7 text-sm font-bold"
        >
          Generate Payments
        </Button>
      }
    >
      <div className="-mt-7 mb-7">
        <PaymentTabs value={tab} onChange={setTab} />
      </div>

      <Card className="min-h-[744px] overflow-hidden p-7">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[15px] font-medium text-[#667085]">
            Showing {filteredData.length || 0}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative hidden w-[344px] md:block">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#667085]" />
              <input
                placeholder="Search by payment reference..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="h-[45px] w-full rounded-[8px] border border-transparent bg-[#f2f4f7] pl-12 pr-4 text-[15px] font-medium outline-none placeholder:text-[#667085]"
              />
            </div>
          </div>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
            <tr>
              <th className="px-4 py-4">Name</th>
              {tab === "qr" ? <th className="px-4 py-4">QR</th> : null}
              <th className="px-4 py-4">Link</th>
              <th className="px-4 py-4">Payment Type</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item._id}
                className="cursor-pointer border-b border-slate-100 text-[15px] font-medium text-[#667085] hover:bg-slate-50"
                onClick={() => setSelectedPayment(item)}
              >
                <td className="px-4 py-5">
                  <div className="flex items-center gap-3">
                    <PaymentKindIcon tab={tab} />
                    <div>
                      <p className="font-semibold text-[#202939]">{getPaymentName(item)}</p>
                      <p className="mt-1 text-xs text-[#667085]">{formatDateTime(item.createdAt)}</p>
                    </div>
                  </div>
                </td>
                {tab === "qr" ? (
                  <td className="px-4 py-5">
                    <QrCode value={getPaymentUrl(item)} size={96} />
                  </td>
                ) : null}
                <td className="px-4 py-5 max-w-[280px]">
                  <p className="truncate" title={getPaymentUrl(item)}>{getPaymentUrl(item)}</p>
                </td>
                <td className="px-4 py-5">{paymentTypeLabel[getPaymentType(item)]}</td>
                <td className="px-4 py-5">
                  <StatusBadge value={getPaymentStatusLabel(item)} />
                </td>
                <td className="px-4 py-5">
                  {item.amount ? formatCurrency(item.amount, item.currency) : "Variable"}
                </td>
              </tr>
            ))}
            {!filteredData.length ? (
              <tr>
                <td colSpan={tab === "qr" ? 6 : 5} className="px-6 py-14 text-center text-sm text-slate-400">
                  No payment links found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

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

      <PaymentLinkDrawer
        open={drawerOpen}
        mode={drawerMode}
        tab={tab}
        form={form}
        isSaving={isSaving}
        onTabChange={setTab}
        onClose={() => setDrawerOpen(false)}
        onFormChange={setForm}
        onSave={handleSave}
      />
    </MerchantShell>
  );
}

function PaymentLinkDrawer({
  open,
  mode,
  tab,
  form,
  isSaving,
  onTabChange,
  onClose,
  onFormChange,
  onSave,
}: {
  open: boolean;
  mode: DrawerMode;
  tab: PaymentTab;
  form: PaymentForm;
  isSaving: boolean;
  onTabChange: (tab: PaymentTab) => void;
  onClose: () => void;
  onFormChange: (form: PaymentForm) => void;
  onSave: () => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/68">
      <button type="button" onClick={onClose} className="flex-1" aria-label="Close drawer" />
      <aside className="h-full w-full max-w-[560px] overflow-y-auto bg-white px-5 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-bold text-[#202939]">
            {mode === "create" ? "Generate Payment" : "Edit Payment Link"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2f7] text-2xl leading-none text-[#98a2b3]"
          >
            ×
          </button>
        </div>
        <div className="mb-7 border-t border-dashed border-[#e2e8f0] pt-6">
          <PaymentTabs value={tab} onChange={onTabChange} />
        </div>

        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <section>
            <p className="mb-4 text-[15px] font-bold uppercase text-[#667085]">Payment Type</p>
            <div className="rounded-[16px] border border-[#d8dee6] p-4">
              {[
                ["one_time", "One - Time Payment"],
                ["multiple", "Multiple Payment"],
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-start gap-3 rounded-[10px] px-1 py-3">
                  <input
                    type="radio"
                    name="paymentType"
                    value={value}
                    checked={form.paymentType === value}
                    onChange={(event) =>
                      onFormChange({
                        ...form,
                        paymentType: event.target.value as "one_time" | "multiple",
                        expires: event.target.value === "multiple" ? form.expires : false,
                        expiryDate: event.target.value === "multiple" ? form.expiryDate : "",
                      })
                    }
                    className="mt-1 h-4 w-4 accent-[#00884f]"
                  />
                  <span className="block text-sm font-bold text-[#202939]">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <Input
            label="Payment Name"
            placeholder="Contribution"
            value={form.name}
            onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            fieldClassName="border-transparent bg-[#f2f4f7]"
          />

          <Input
            label="Amount"
            placeholder="Leave empty for variable amount"
            inputMode="decimal"
            value={form.amount}
            onBlur={() => onFormChange({ ...form, amount: form.amount.replace(/\.$/, "") })}
            onChange={(event) =>
              onFormChange({ ...form, amount: formatAmountInput(event.target.value) })
            }
            trailing={<span className="text-xs font-bold text-[#98a2b3]">NGN</span>}
            fieldClassName="border-transparent bg-[#f2f4f7]"
          />

          {form.paymentType === "multiple" ? (
            <>
              <label className="flex min-h-10 items-center justify-between gap-4 rounded-[10px] bg-[#f2f4f7] px-4">
                <span className="text-[14px] font-semibold text-[#344054]">Link expires</span>
                <button
                  type="button"
                  onClick={() => onFormChange({ ...form, expires: !form.expires, expiryDate: "" })}
                  className={`relative h-[24px] w-[44px] rounded-full transition ${
                    form.expires ? "bg-[#00884f]" : "bg-[#d0d5dd]"
                  }`}
                  aria-pressed={form.expires}
                >
                  <span
                    className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition ${
                      form.expires ? "left-[23px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </label>
              {form.expires ? (
                <Input
                  label="Expiry Date"
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) => onFormChange({ ...form, expiryDate: event.target.value })}
                  fieldClassName="border-transparent bg-[#f2f4f7]"
                />
              ) : null}
            </>
          ) : null}

          <Button
            type="submit"
            loading={isSaving}
            className="dashboard-black-button mt-6 h-[52px] rounded-[8px] text-[15px] font-bold"
          >
            {mode === "create" ? "Generate" : "Save Changes"}
          </Button>
        </form>
      </aside>
    </div>
  );
}
