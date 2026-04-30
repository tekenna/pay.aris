"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { TransactionReceipt } from "@/components/checkout/transaction-receipt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { merchantApi } from "@/lib/merchant-api";
import type { CheckoutSession } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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

function resolveCheckoutSession(data: Partial<CheckoutSession> & { session?: CheckoutSession }) {
  const { session, ...topLevel } = data;
  return {
    ...(session || {}),
    ...topLevel,
  } as CheckoutSession;
}

function getStoredAttemptReference(reference: string) {
  const key = `aris-pay.checkout-attempt.${reference}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const next = `${reference}-WEB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(Math.max(totalSeconds, 0) / 60);
  const seconds = Math.max(totalSeconds, 0) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const params = useParams<{ reference: string }>();
  const reference = params.reference;
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customerAmount, setCustomerAmount] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [attemptReference, setAttemptReference] = useState<string | null>(null);
  const [pageState, setPageState] = useState<"ready" | "not_found" | "bad_gateway">("ready");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const initializedReference = useRef<string | null>(null);

  useEffect(() => {
    async function loadCheckout() {
      if (!reference || initializedReference.current === reference) {
        return;
      }

      initializedReference.current = reference;
      setIsInitializing(true);
      setMessage(null);
      setPageState("ready");

      try {
        const nextAttemptReference = getStoredAttemptReference(reference);
        setAttemptReference(nextAttemptReference);
        const response = await merchantApi.getCheckoutSession(reference, {
          attemptReference: nextAttemptReference,
        });
        if (response.statusCode !== 200) {
          if (response.statusCode === 404) {
            setPageState("not_found");
          } else if (response.statusCode === 502) {
            setPageState("bad_gateway");
          }
          if (response.data?.session) {
            setSession(resolveCheckoutSession(response.data));
          }
          setMessage(response.message);
          return;
        }

        const nextSession = resolveCheckoutSession(response.data);
        setSession(nextSession);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load checkout.");
      } finally {
        setIsInitializing(false);
      }
    }

    void loadCheckout();
  }, [reference]);

  const isSuccess = session?.status === "success";
  const isFailed = session?.status === "failed" || session?.status === "expired";

  useEffect(() => {
    if (!session?.expiresAt || isSuccess || isFailed) {
      setRemainingSeconds(0);
      return;
    }

    function tick() {
      const expiresAt = new Date(session?.expiresAt || "").getTime();
      setRemainingSeconds(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isFailed, isSuccess, session?.expiresAt]);

  const headline = useMemo(() => {
    if (isSuccess) {
      return "Payment successful";
    }
    if (isFailed) {
      return "Payment not completed";
    }
    if (isInitializing) {
      return "Preparing checkout";
    }
    return "Complete payment";
  }, [isFailed, isInitializing, isSuccess]);

  async function handleGenerateVirtualAccount() {
    const amount = session?.amount ? Number(session.amount) : parseAmountInput(customerAmount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setMessage("Enter the amount you want to pay.");
      return;
    }

    setIsInitializing(true);
    setMessage(null);

    try {
      const nextAttemptReference =
        attemptReference || getStoredAttemptReference(reference);
      setAttemptReference(nextAttemptReference);
      const response = await merchantApi.getCheckoutSession(reference, {
        amount,
        attemptReference: nextAttemptReference,
      });
      if (response.statusCode === 200) {
        setSession(resolveCheckoutSession(response.data));
      } else {
        setMessage(response.message || "Unable to generate payment account.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate payment account.");
    } finally {
      setIsInitializing(false);
    }
  }

  async function handleConfirmPayment() {
    setIsConfirming(true);
    setMessage(null);

    try {
      const response = await merchantApi.verifyPayment(reference, {
        attemptReference,
      });
      if (response.statusCode === 200 && response.data.status === "success") {
        const callbackUrl = response.data.callbackUrl || session?.callbackUrl || null;
        setSession((current) =>
          current
            ? {
                ...current,
                status: response.data.status,
                paidAt: response.data.paidAt,
                expiresAt: response.data.expiresAt,
                callbackUrl,
              }
            : current,
        );
        setMessage(callbackUrl ? "Payment confirmed. Redirecting..." : response.message);

        if (callbackUrl) {
          window.setTimeout(() => {
            window.location.href = callbackUrl;
          }, 1200);
        }

        return;
      }

      setSession((current) =>
        current
          ? {
              ...current,
              status:
                response.statusCode === 200 &&
                ["failed", "expired"].includes(response.data.status)
                  ? response.data.status
                  : current.status,
            }
          : current,
      );
      setMessage("Payment has not been confirmed yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment has not been confirmed yet.");
    } finally {
      setIsConfirming(false);
    }
  }

  const requiresCustomerAmount =
    Boolean(session) &&
    !isSuccess &&
    !isFailed &&
    !session?.virtualAccount?.accountNumber &&
    !session?.amount;
  const messageTone = isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600";
  const receiptAmount = Number(session?.amount || session?.virtualAccount?.amount || 0);
  const receiptSessionId = session?.virtualAccount?.providerReference || attemptReference || session?.reference || reference;
  const receiptRecipientName =
    session?.businessName ||
    session?.virtualAccount?.accountName ||
    "Aris Pay Merchant";
  const receiptBankName = session?.virtualAccount?.bankName || "SafeHaven MFB";
  const receiptAccountNumber = session?.virtualAccount?.accountNumber || "--";
  const receiptSourceBankName = "SafeHaven MFB";
  const receiptSourceAccountName =
    session?.customer?.name ||
    session?.customer?.email ||
    "Guest customer";
  const receiptNarration = session?.description || session?.reference || "--";

  async function handleDownloadReceipt() {
    if (!receiptRef.current || !isSuccess) {
      return;
    }

    setIsDownloadingReceipt(true);

    try {
      if (typeof document !== "undefined" && "fonts" in document) {
        await (document.fonts as FontFaceSet).ready;
      }

      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
        compress: true,
      });

      pdf.addImage(imageData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${reference}-receipt.pdf`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download receipt.");
    } finally {
      setIsDownloadingReceipt(false);
    }
  }

  if (pageState === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/85 px-4 py-10">
        <Card className="w-full max-w-[480px] p-8 text-center">
          <Wordmark compact />
          <h1 className="mt-8 text-4xl font-bold text-slate-950">404</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Checkout reference not found.</p>
        </Card>
      </div>
    );
  }

  if (pageState === "bad_gateway") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/85 px-4 py-10">
        <Card className="w-full max-w-[480px] p-8 text-center">
          <Wordmark compact />
          <h1 className="mt-8 text-3xl font-bold text-slate-950">Bad gateway</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Payment not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/85 px-4 py-10">
      <Card className="w-full max-w-[480px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <Wordmark compact />
        </div>

        <div className="p-6">
          <div className="text-center">
            <div
              className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                isSuccess
                  ? "bg-emerald-100 text-emerald-600"
                  : isFailed
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
              }`}
            >
              {isSuccess ? "✓" : isFailed ? "!" : "→"}
            </div>
            <h1 className="text-3xl font-semibold text-slate-950">{headline}</h1>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {formatCurrency(session?.amount, session?.currency)}
            </p>
            <div className="mt-4">
              <StatusBadge value={session?.status || "pending"} />
            </div>
            <p className="mt-3 text-sm text-slate-400">{session?.reference || reference}</p>
            {session?.virtualAccount?.accountNumber && !isSuccess && !isFailed ? (
              <div className="mt-5 rounded-[12px] bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                Expires in {formatCountdown(remainingSeconds)}
              </div>
            ) : null}
          </div>

          {message ? <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${messageTone}`}>{message}</p> : null}

          {requiresCustomerAmount ? (
            <div className="mt-8">
              <Input
                label="Amount"
                inputMode="decimal"
                placeholder="Enter amount"
                value={customerAmount}
                onChange={(event) => setCustomerAmount(formatAmountInput(event.target.value))}
                onBlur={() => setCustomerAmount((current) => current.replace(/\.$/, ""))}
                trailing={<span className="text-xs font-bold text-slate-400">NGN</span>}
              />
            </div>
          ) : null}

          <div className="mt-8 divide-y divide-slate-100 rounded-[24px] border border-slate-100">
            {[
              ["Customer", session?.customer?.name || session?.customer?.email || "Guest customer"],
              ["Bank Name", session?.virtualAccount?.bankName || "--"],
              ["Account Name", session?.virtualAccount?.accountName || "--"],
              ["Account Number", session?.virtualAccount?.accountNumber || "--"],
              ["Description", session?.description || "--"],
              ["Expires", formatDateTime(session?.expiresAt)],
              ["Paid At", formatDateTime(session?.paidAt)],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 px-5 py-4 text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="text-right font-medium text-slate-700">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3">
            {requiresCustomerAmount || (!session?.virtualAccount?.accountNumber && !isSuccess && !isFailed) ? (
              <Button
                className="w-full"
                loading={isInitializing}
                onClick={handleGenerateVirtualAccount}
              >
                Generate payment account
              </Button>
            ) : !isSuccess && !isFailed ? (
              <Button
                className="w-full"
                loading={isConfirming}
                onClick={handleConfirmPayment}
              >
                I&apos;ve made payment
              </Button>
            ) : null}
            <Button
              variant="secondary"
              className="w-full"
              disabled={!isSuccess}
              loading={isDownloadingReceipt}
              onClick={handleDownloadReceipt}
            >
              Download receipt
            </Button>
          </div>
        </div>
      </Card>
      {isSuccess ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-200vw] top-0 opacity-0"
        >
          <div ref={receiptRef}>
            <TransactionReceipt
              amount={receiptAmount}
              paidAt={session?.paidAt}
              status={session?.status}
              sessionId={receiptSessionId}
              recipientName={receiptRecipientName}
              bankName={receiptBankName}
              accountNumber={receiptAccountNumber}
              sourceBankName={receiptSourceBankName}
              sourceAccountName={receiptSourceAccountName}
              narration={receiptNarration}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
