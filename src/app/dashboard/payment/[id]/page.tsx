"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import {
  buildFormState,
  DrawerMode,
  getActivityIcon,
  getActivitySubtitle,
  getActivityTitle,
  getActivityTone,
  getPaymentName,
  getPaymentStatusLabel,
  getPaymentType,
  getPaymentUrl,
  groupTransactionsByDate,
  PaymentDetailsTab,
  PaymentForm,
  PaymentKindIcon,
  PaymentLinkDrawer,
  PaymentTab,
  paymentTypeLabel,
  parseAmountInput,
} from "@/components/dashboard/payment-link-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { createQrCodeSvg, QrCode } from "@/components/ui/qr-code";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckIcon, ChevronLeft, CopyIcon } from "@/components/ui/icons";
import type {
  BusinessSettlementAccount,
  BusinessTransaction,
  CheckoutSession,
} from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { accountsService } from "@/services/accounts.service";
import { paymentsService } from "@/services/payments.service";
import { transactionsService } from "@/services/transactions.service";
import { useBusinessSession } from "@/store/business-session-provider";

export default function PaymentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useBusinessSession();
  const [settlementAccounts, setSettlementAccounts] = useState<
    BusinessSettlementAccount[]
  >([]);
  const [payment, setPayment] = useState<CheckoutSession | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [detailsTab, setDetailsTab] = useState<PaymentDetailsTab>("details");
  const [paymentTransactions, setPaymentTransactions] = useState<
    BusinessTransaction[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [transactionPages, setTransactionPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<PaymentTab>("links");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<PaymentForm>(buildFormState([]));
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.token) {
        return;
      }

      try {
        const response = await accountsService.getProfile(session.token);
        if (response.statusCode === 200) {
          setSettlementAccounts(response.data.settlementAccounts || []);
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
    async function loadPayment() {
      if (!session?.token || !params?.id) {
        return;
      }

      setLoadingPayment(true);
      try {
        const response = await paymentsService.getPaymentById(
          session.token,
          params.id,
        );
        if (response.statusCode === 200) {
          setPayment(response.data);
          setForm(buildFormState(settlementAccounts, response.data));
        } else {
          setPayment(null);
          toast.error(response.message || "Payment link not found.");
        }
      } catch {
        setPayment(null);
        toast.error("Unable to load payment link.");
      } finally {
        setLoadingPayment(false);
      }
    }

    void loadPayment();
  }, [params?.id, session?.token, settlementAccounts]);

  useEffect(() => {
    async function loadPaymentTransactions() {
      if (!session?.token || !payment?._id) {
        setPaymentTransactions([]);
        setTransactionPages(1);
        return;
      }

      setLoadingTransactions(true);
      try {
        const params = new URLSearchParams({
          checkoutSessionId: payment._id,
          page: String(transactionPage),
          limit: String(transactionLimit),
        });
        const response = await transactionsService.getTransactions(
          session.token,
          params,
        );
        if (response.statusCode === 200) {
          setPaymentTransactions(response.data);
          setTransactionPages(response.pagination?.pages || 1);
        } else {
          setPaymentTransactions([]);
          setTransactionPages(1);
        }
      } finally {
        setLoadingTransactions(false);
      }
    }

    void loadPaymentTransactions();
  }, [payment?._id, session?.token, transactionLimit, transactionPage]);

  const paymentDetails = useMemo(
    () =>
      payment
        ? [
            { label: "Status", value: getPaymentStatusLabel(payment) },
            { label: "Reference", value: payment.reference },
            {
              label: "Payment Type",
              value: paymentTypeLabel[getPaymentType(payment)],
            },
            {
              label: "Amount",
              value: payment.amount
                ? formatCurrency(payment.amount, payment.currency)
                : "Customer enters amount",
            },
            { label: "Checkout URL", value: getPaymentUrl(payment) },
            {
              label: "Link Expiry",
              value: formatDateTime(payment.linkExpiresAt),
            },
            {
              label: "Activated At",
              value: formatDateTime(payment.activatedAt),
            },
            { label: "Paid At", value: formatDateTime(payment.paidAt) },
            { label: "Created At", value: formatDateTime(payment.createdAt) },
            {
              label: "Settlement Account",
              value: payment.settlementAccount?.accountName || "--",
            },
            {
              label: "Settlement Number",
              value: payment.settlementAccount?.accountNumber || "--",
            },
            ...(payment.paymentType === "multiple"
              ? []
              : [
                  {
                    label: "Virtual Account",
                    value: payment.virtualAccount?.accountNumber || "--",
                  },
                  {
                    label: "Account Name",
                    value: payment.virtualAccount?.accountName || "--",
                  },
                  {
                    label: "Bank Name",
                    value: payment.virtualAccount?.bankName || "--",
                  },
                  {
                    label: "Virtual Account Expiry",
                    value: formatDateTime(payment.virtualAccount?.expiresAt),
                  },
                ]),
          ]
        : [],
    [payment],
  );

  const transactionGroups = useMemo(
    () => groupTransactionsByDate(paymentTransactions),
    [paymentTransactions],
  );

  async function handleSave() {
    if (!session?.token || !payment?._id) {
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

      const response = await paymentsService.updatePaymentLink(
        session.token,
        payment._id,
        payload,
      );

      if (response.statusCode !== 200 && response.statusCode !== 201) {
        toast.error(response.message || "Unable to save payment link.");
        return;
      }

      setPayment(response.data);
      setForm(buildFormState(settlementAccounts, response.data));
      toast.success("Payment link updated.");
      setDrawerOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save payment link.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!payment) return;

    try {
      await navigator.clipboard.writeText(getPaymentUrl(payment));
      setCopiedLink(true);
      toast.success("Payment link copied.");
      window.setTimeout(() => setCopiedLink(false), 1200);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to copy payment link.",
      );
    }
  }

  function handleDownloadQr() {
    if (!payment) return;

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

  useEffect(() => {
    if (payment) {
      setForm(buildFormState(settlementAccounts, payment));
      setDrawerTab(payment.virtualAccount?.accountNumber ? "qr" : "links");
    }
  }, [payment, settlementAccounts]);

  if (loadingPayment) {
    return (
      <MerchantShell title="Payment Details">
        <Card className="p-7 text-sm text-[#667085]">
          Loading payment link...
        </Card>
      </MerchantShell>
    );
  }

  if (!payment) {
    return (
      <MerchantShell title="Payment Details">
        <button
          type="button"
          onClick={() => router.push("/dashboard/payment")}
          className="-mt-6 mb-10  inline-flex w-fit items-center gap-2 text-sm font-bold text-[#344054]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <Card className="p-7 text-sm text-[#667085]">
          We couldn&apos;t find that payment link.
        </Card>
      </MerchantShell>
    );
  }

  const isMultiplePayment = payment.paymentType === "multiple";

  return (
    <MerchantShell title="Payment Details">
      <button
        type="button"
        onClick={() => router.push("/dashboard/payment")}
        className="-mt-6 mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#344054]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <Card className="mb-7 flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="flex items-center gap-4">
          <PaymentKindIcon
            tab={payment.virtualAccount?.accountNumber ? "qr" : "links"}
          />
          <div>
            <p className="text-[18px] font-bold text-[#202939]">
              {getPaymentName(payment)}
            </p>
            <p className="mt-2 break-all text-[15px] font-medium text-[#667085]">
              {getPaymentUrl(payment)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#e4e7ec] bg-white text-[#344054] transition hover:bg-[#f8fafc]"
            aria-label="Copy payment link"
            title="Copy payment link"
          >
            {copiedLink ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>
          <Button
            variant="outline"
            className="h-10 rounded-[8px] px-5 text-sm font-bold"
            onClick={handleDownloadQr}
          >
            Download QR
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-[8px] px-5 text-sm font-bold"
            onClick={() => setDrawerOpen(true)}
          >
            Edit Link
          </Button>
        </div>
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
              <StatusBadge value={getPaymentStatusLabel(payment)} />
              {payment.virtualAccount?.accountNumber ? (
                <StatusBadge value="QR Ready" />
              ) : null}
            </div>

            <div className="mb-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] bg-[#0f172a] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/60">
                  Amount
                </p>
                <p className="mt-3 text-[26px] font-bold leading-none">
                  {payment.amount
                    ? formatCurrency(payment.amount, payment.currency)
                    : "Variable"}
                </p>
              </div>
              <div className="rounded-[16px] bg-[#f8fafc] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Payment Status
                </p>
                <div className="mt-3">
                  <StatusBadge value={getPaymentStatusLabel(payment)} />
                </div>
              </div>
              <div className="rounded-[16px] bg-[#f8fafc] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Payment Date
                </p>
                <p className="mt-3 text-sm font-semibold text-[#202939]">
                  {formatDateTime(payment.paidAt || payment.createdAt)}
                </p>
              </div>
            </div>

            {(detailsTab === "details" || !isMultiplePayment) && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentDetails.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[12px] bg-[#f8fafc] p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                        {item.label}
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold text-[#202939]">
                        {item.value || "--"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailsTab === "transactions" && isMultiplePayment && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[18px] border border-[#E4E7EC] bg-white">
                  <div className="border-b border-[#E4E7EC] bg-[#F8FAFC] px-5 py-4">
                    <p className="text-sm font-bold text-[#111827]">
                      Transactions
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">
                      Every transaction recorded against this payment link.
                    </p>
                  </div>
                  <div className="px-5 py-5">
                    {loadingTransactions ? (
                      <div className="rounded-[14px] bg-[#F8FAFC] px-4 py-12 text-center text-sm text-[#98A2B3]">
                        Loading transactions...
                      </div>
                    ) : null}

                    {!loadingTransactions && !paymentTransactions.length ? (
                      <div className="rounded-[14px] bg-[#F8FAFC] px-4 py-12 text-center text-sm text-[#98A2B3]">
                        No transactions recorded for this payment link yet.
                      </div>
                    ) : null}

                    {!loadingTransactions && paymentTransactions.length ? (
                      <div className="space-y-8">
                        {transactionGroups.map((group) => (
                          <div key={group.label}>
                            <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#98A2B3]">
                              {group.label}
                            </p>
                            <div className="space-y-4">
                              {group.transactions.map((item) => {
                                const tone = getActivityTone(item);

                                return (
                                  <div
                                    key={item._id}
                                    className="flex items-start justify-between gap-4 rounded-[16px] bg-[#FBFCFE] px-4 py-4"
                                  >
                                    <div className="flex min-w-0 items-start gap-4">
                                      <span
                                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${tone.iconClass}`}
                                      >
                                        {getActivityIcon(item)}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                          {getActivityTitle(item)}
                                        </p>
                                        <p className="mt-1 text-xs">
                                          <span
                                            className={`font-semibold ${tone.statusClass}`}
                                          >
                                            {item.status === "success"
                                              ? "Success"
                                              : item.status === "failed"
                                                ? "Failed"
                                                : item.status === "pending"
                                                  ? "Pending"
                                                  : item.status}
                                          </span>
                                          <span className="text-[#667085]">
                                            {" "}
                                            · {getActivitySubtitle(item)}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p
                                        className={`text-sm font-semibold ${tone.amountClass}`}
                                      >
                                        {item.direction === "debit" ||
                                        item.category === "checkout_fee"
                                          ? "- "
                                          : ""}
                                        {formatCurrency(
                                          Math.abs(Number(item.amount ?? 0)),
                                          item.currency,
                                        )}
                                      </p>
                                      {item.balanceAfter !== null &&
                                      item.balanceAfter !== undefined ? (
                                        <p
                                          className={`mt-1 text-xs font-semibold whitespace-nowrap ${tone.amountClass}`}
                                        >
                                          Bal.{" "}
                                          {formatCurrency(
                                            item.balanceAfter,
                                            item.currency,
                                          )}
                                        </p>
                                      ) : null}
                                      {/* {item.balanceBefore !== null &&
                                      item.balanceBefore !== undefined ? (
                                        <p className="mt-1 text-xs text-[#98A2B3]">
                                          Previous -{" "}
                                          {formatCurrency(
                                            item.balanceBefore,
                                            item.currency,
                                          )}
                                        </p>
                                      ) : null}
                                      {item.paidAt || item.createdAt ? (
                                        <p className="mt-1 text-xs text-[#98A2B3]">
                                          {formatDateTime(
                                            item.paidAt || item.createdAt,
                                          )}
                                        </p>
                                      ) : null} */}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="border-t border-[#E4E7EC] bg-white px-5 py-4">
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
              </div>
            )}
          </div>

          <aside className="rounded-[20px] border border-[#e4e7ec] bg-[#f8fafc] p-5 xl:sticky xl:top-6 xl:self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Payment QR
                </p>
                <p className="mt-2 text-sm font-medium text-[#667085]">
                  Customers can scan this code to open the payment link
                  directly.
                </p>
              </div>
              <StatusBadge
                value={payment.virtualAccount?.accountNumber ? "Live" : "Ready"}
              />
            </div>
            <div className="mt-6 flex justify-center">
              <QrCode value={getPaymentUrl(payment)} size={220} />
            </div>
            <Button
              variant="outline"
              className="mt-5 w-full text-sm font-bold"
              onClick={handleDownloadQr}
            >
              Download QR Code
            </Button>
          </aside>
        </div>
      </Card>

      <PaymentLinkDrawer
        open={drawerOpen}
        mode={"edit"}
        tab={drawerTab}
        form={form}
        isSaving={isSaving}
        onTabChange={setDrawerTab}
        onClose={() => setDrawerOpen(false)}
        onFormChange={setForm}
        onSave={handleSave}
        settlementAccounts={settlementAccounts}
      />
    </MerchantShell>
  );
}
