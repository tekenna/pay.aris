"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import {
  buildFormState,
  DrawerMode,
  getPaymentName,
  getPaymentStatusLabel,
  getPaymentType,
  getPaymentUrl,
  PaymentForm,
  PaymentKindIcon,
  PaymentLinkDrawer,
  PaymentTab,
  PaymentTabs,
  paymentTypeLabel,
  parseAmountInput,
} from "@/components/dashboard/payment-link-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { createQrCodeSvg, QrCode } from "@/components/ui/qr-code";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckIcon, CopyIcon, SearchIcon } from "@/components/ui/icons";
import type { BusinessSettlementAccount, CheckoutSession } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { accountsService } from "@/services/accounts.service";
import { paymentsService } from "@/services/payments.service";
import { useBusinessSession } from "@/store/business-session-provider";

export default function PaymentPage() {
  const router = useRouter();
  const { session } = useBusinessSession();
  const [settlementAccounts, setSettlementAccounts] = useState<BusinessSettlementAccount[]>([]);
  const [data, setData] = useState<CheckoutSession[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [tab, setTab] = useState<PaymentTab>("links");
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [isSaving, setIsSaving] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(buildFormState([]));
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.token) {
        return;
      }

      try {
        const response = await accountsService.getProfile(session.token);
        if (response.statusCode === 200) {
          const nextAccounts = response.data.settlementAccounts || [];
          setSettlementAccounts(nextAccounts);
          setForm((current) =>
            current.settlementAccountId
              ? current
              : {
                  ...current,
                  settlementAccountId: buildFormState(nextAccounts).settlementAccountId,
                },
          );
        } else {
          setSettlementAccounts([]);
        }
      } catch {
        setSettlementAccounts([]);
      }
    }

    void loadProfile();
  }, [session?.token]);

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

      try {
        const response = await paymentsService.getPayments(session.token, params);
        if (response.statusCode === 200) {
          setData(response.data);
          setPages(response.pagination?.pages || 1);
        } else {
          setData([]);
          setPages(1);
        }
      } catch {
        setData([]);
        setPages(1);
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

  function openCreateDrawer() {
    setDrawerMode("create");
    setEditingSessionId(null);
    setForm(buildFormState(settlementAccounts));
    setDrawerOpen(true);
  }

  function openEditDrawer(payment: CheckoutSession) {
    setDrawerMode("edit");
    setEditingSessionId(payment._id);
    setForm(buildFormState(settlementAccounts, payment));
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
        settlementAccountId: form.settlementAccountId || undefined,
        expires: form.paymentType === "multiple" ? form.expires : false,
        expiresAt:
          form.paymentType === "multiple" && form.expires && form.expiryDate
            ? new Date(form.expiryDate).toISOString()
            : null,
      };

      const response =
        drawerMode === "create"
          ? await paymentsService.createPaymentLink(session.token, payload)
          : await paymentsService.updatePaymentLink(
              session.token,
              editingSessionId!,
              payload,
            );

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

      toast.success(
        drawerMode === "create" ? "Payment link generated." : "Payment link updated.",
      );
      setDrawerOpen(false);

      if (drawerMode === "edit") {
        router.push(`/dashboard/payment/${nextSession._id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save payment link.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyLink(
    event: React.MouseEvent<HTMLButtonElement>,
    payment: CheckoutSession,
  ) {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(getPaymentUrl(payment));
      setCopiedLinkId(payment._id || payment.reference);
      toast.success("Payment link copied.");
      window.setTimeout(() => {
        setCopiedLinkId((current) =>
          current === (payment._id || payment.reference) ? null : current,
        );
      }, 1200);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to copy payment link.",
      );
    }
  }

  function handleDownloadQr(
    event: React.MouseEvent<HTMLButtonElement>,
    payment: CheckoutSession,
  ) {
    event.stopPropagation();

    const markup = createQrCodeSvg(getPaymentUrl(payment));
    if (!markup) {
      toast.error("QR code is unavailable for this payment link.");
      return;
    }

    const blob = new Blob([markup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payment.reference}-qr.svg`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("QR code downloaded.");
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
                onClick={() => router.push(`/dashboard/payment/${item._id}`)}
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
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate" title={getPaymentUrl(item)}>
                      {getPaymentUrl(item)}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        void handleCopyLink(event, item);
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f4f7] text-[#344054] transition hover:bg-[#e9eef4]"
                      aria-label="Copy payment link"
                      title="Copy payment link"
                    >
                      {copiedLinkId === (item._id || item.reference) ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-5">{paymentTypeLabel[getPaymentType(item)]}</td>
                <td className="px-4 py-5">
                  <StatusBadge value={getPaymentStatusLabel(item)} />
                </td>
                <td className="px-4 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {item.amount
                        ? formatCurrency(item.amount, item.currency)
                        : "Variable"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-[12px] font-bold"
                        onClick={(event) => handleDownloadQr(event, item)}
                      >
                        QR
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-[12px] font-bold"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDrawer(item);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
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
        settlementAccounts={settlementAccounts}
      />
    </MerchantShell>
  );
}
