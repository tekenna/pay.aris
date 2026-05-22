"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AccountsIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PaymentIcon,
  ScanIcon,
} from "@/components/ui/icons";
import type { BusinessSettlementAccount, BusinessTransaction, CheckoutSession } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export type PaymentTab = "links" | "qr";
export type DrawerMode = "create" | "edit";
export type PaymentDetailsTab = "details" | "transactions";

export type PaymentForm = {
  paymentType: "one_time" | "multiple";
  name: string;
  amount: string;
  expires: boolean;
  expiryDate: string;
  settlementAccountId: string;
};

export const paymentTypeLabel = {
  one_time: "One Time",
  multiple: "Multiple",
};

export function formatAmountInput(value: string) {
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

export function parseAmountInput(value: string) {
  return Number(value.replace(/,/g, ""));
}

export function getPaymentName(session: CheckoutSession) {
  return session.description || "Aris Contribution";
}

export function getPaymentUrl(session: CheckoutSession) {
  return session.checkoutUrl || `https://checkout.ariswallex.com/${session.reference}`;
}

export function getPaymentType(session: CheckoutSession) {
  return session.paymentType || "one_time";
}

export function getPaymentStatusLabel(session: CheckoutSession) {
  if (session.status === "inactive") return "Inactive";
  if (session.status === "active") return "Active";
  if (session.status === "success") return "Paid";
  return session.status || "unknown";
}

export function formatActivityDateHeading(value?: string | null) {
  if (!value) return "UNKNOWN DATE";

  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).toUpperCase();
}

export function getActivityTitle(item: BusinessTransaction) {
  if (item.category === "checkout_fee") {
    return `${formatCurrency(item.amount, item.currency)} commission`;
  }

  if (item.direction === "debit") {
    return `${formatCurrency(item.amount, item.currency)} sent to ${
      item.virtualAccount?.accountNumber ||
      item.customer?.accountNumber ||
      item.virtualAccount?.accountName ||
      "recipient"
    }`;
  }

  return `${formatCurrency(item.amount, item.currency)} received from`;
}

export function getActivitySubtitle(item: BusinessTransaction) {
  const counterparty =
    item.customer?.name ||
    item.customer?.email ||
    item.virtualAccount?.accountName ||
    item.virtualAccount?.accountNumber ||
    null;

  if (counterparty && item.category !== "checkout_fee") {
    return `${counterparty} · ${item.reference}`;
  }

  return item.reference;
}

export function getActivityTone(item: BusinessTransaction) {
  if (item.status === "failed") {
    return {
      badgeClass: "bg-[#FEF3F2] text-[#F04438]",
      amountClass: "text-[#F04438]",
      statusClass: "text-[#F04438]",
      iconClass: "bg-[#FEF3F2] text-[#F04438]",
    };
  }

  if (item.direction === "debit" || item.category === "checkout_fee") {
    return {
      badgeClass: "bg-[#FFF7ED] text-[#F97316]",
      amountClass: "text-[#F97316]",
      statusClass: "text-[#12B76A]",
      iconClass: "bg-[#FFF7ED] text-[#F97316]",
    };
  }

  return {
    badgeClass: "bg-[#ECFDF3] text-[#12B76A]",
    amountClass: "text-[#12B76A]",
    statusClass: "text-[#12B76A]",
    iconClass: "bg-[#ECFDF3] text-[#12B76A]",
  };
}

export function getActivityIcon(item: BusinessTransaction) {
  if (item.category === "checkout_fee") {
    return <AccountsIcon className="h-4 w-4" />;
  }

  if (item.direction === "debit") {
    return <ArrowUpRightIcon className="h-4 w-4" />;
  }

  return <ArrowDownLeftIcon className="h-4 w-4" />;
}

export function groupTransactionsByDate(items: BusinessTransaction[]) {
  const groups = new Map<string, BusinessTransaction[]>();

  items.forEach((item) => {
    const dateKey = formatActivityDateHeading(item.paidAt || item.createdAt);
    const bucket = groups.get(dateKey) || [];
    bucket.push(item);
    groups.set(dateKey, bucket);
  });

  return Array.from(groups.entries()).map(([label, transactions]) => ({
    label,
    transactions,
  }));
}

export function getDefaultSettlementAccountId(accounts: BusinessSettlementAccount[]) {
  return (
    accounts.find((account) => account.kind === "checkout")?.id ||
    accounts[0]?.id ||
    ""
  );
}

export function PaymentKindIcon({ tab }: { tab: PaymentTab }) {
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

export function PaymentTabs({
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

export function buildFormState(
  accounts: BusinessSettlementAccount[],
  session?: CheckoutSession | null,
): PaymentForm {
  return {
    paymentType: (session?.paymentType as "one_time" | "multiple") || "multiple",
    name: session?.description || "",
    amount: session?.amount ? formatAmountInput(String(session.amount)) : "",
    expires: Boolean(session?.linkExpires),
    expiryDate: session?.linkExpiresAt ? String(session.linkExpiresAt).slice(0, 10) : "",
    settlementAccountId:
      session?.settlementAccount?.accountId || getDefaultSettlementAccountId(accounts),
  };
}

export function PaymentLinkDrawer({
  open,
  mode,
  tab,
  form,
  isSaving,
  onTabChange,
  onClose,
  onFormChange,
  onSave,
  settlementAccounts,
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
  settlementAccounts: BusinessSettlementAccount[];
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

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#344054]">Settlement account</span>
            <select
              value={form.settlementAccountId}
              onChange={(event) =>
                onFormChange({ ...form, settlementAccountId: event.target.value })
              }
              disabled={!settlementAccounts.length}
              className="h-12 rounded-[10px] border border-transparent bg-[#f2f4f7] px-4 text-sm font-medium text-[#101828] outline-none disabled:cursor-not-allowed disabled:text-[#98a2b3]"
            >
              {!settlementAccounts.length ? (
                <option value="">No settlement account available</option>
              ) : null}
              {settlementAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} • {account.accountNumber}
                </option>
              ))}
            </select>
          </label>

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
            disabled={!form.settlementAccountId}
            className="dashboard-black-button mt-6 h-[52px] rounded-[8px] text-[15px] font-bold"
          >
            {mode === "create" ? "Generate" : "Save Changes"}
          </Button>
        </form>
      </aside>
    </div>
  );
}
