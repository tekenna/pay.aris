"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BankIcon,
  ChevronDown,
  ChevronLeft,
  SearchIcon,
  SpinnerIcon,
  XIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { downloadReceiptPdf } from "@/lib/receipt-pdf";
import {
  BANKS,
  type Bank,
  findBankByCode,
  formatAccountNumber,
  getBankLogoUrl,
  getBankSuggestions,
  type BankSuggestion,
} from "@/lib/bank-suggestions";
import type {
  Business,
  BusinessSettlementAccount,
  MerchantFeeSchedule,
  MerchantBank,
  RecentBusinessTransfer,
  ValidatedTransferAccount,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { accountsService } from "@/services/accounts.service";
import { paymentsService } from "@/services/payments.service";
import { useBusinessSession } from "@/store/business-session-provider";

type DrawerStep = "confirm" | "success" | null;
type TransferPinModalStep = "closed" | "create" | "enter-pin";

function calculateTransferFee(
  feeSchedule: MerchantFeeSchedule | null,
  amount: number,
) {
  if (!feeSchedule || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const band = feeSchedule.transfer.find((item) => {
    if (amount < item.minAmount) {
      return false;
    }

    if (item.maxAmount !== null && amount > item.maxAmount) {
      return false;
    }

    return true;
  });

  if (!band) {
    return 0;
  }

  const providerFeeAmount =
    band.providerFeeType === "percentage"
      ? Number(((amount * band.providerFeeValue) / 100).toFixed(2))
      : band.providerFeeValue;

  return Number((providerFeeAmount + band.markupFee).toFixed(2));
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
        checked
          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
          : "border-[#d8e0ea] bg-[#eef2f6]"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.12)] transition ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
      {children}
    </p>
  );
}

function ActionRow({
  icon,
  title,
  description,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[#0f1728]">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-sm text-[#64748b]">
              {description}
            </span>
          ) : null}
        </span>
      </div>
      <span className="shrink-0 text-[#64748b]">{trailing}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 rounded-[8px] px-3 py-3 text-left transition hover:bg-[#f8faf9]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3">
      {content}
    </div>
  );
}

function mapMerchantBank(bank: MerchantBank): Bank {
  return {
    name: bank.name,
    bankCode: bank.bankCode,
    cbnCode: bank.cbnCode || "",
    logoUrl: bank.logoUrl || null,
  };
}

function BankAvatar({
  name,
  logoUrl,
  className = "h-10 w-10",
}: {
  name?: string | null;
  logoUrl?: string | null;
  className?: string;
}) {
  const resolvedLogo = getBankLogoUrl(name, logoUrl);

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#f8fafb] ${className}`}
    >
      {resolvedLogo ? (
        <Image
          src={resolvedLogo}
          alt={name || "Bank"}
          fill
          className="object-contain p-1.5"
        />
      ) : (
        <BankIcon className="h-5 w-5 text-[#667085]" />
      )}
    </span>
  );
}

function buildBusinessAccounts(
  profile: Business | null,
): BusinessSettlementAccount[] {
  return profile?.settlementAccounts ?? [];
}

function getDefaultWithdrawalAccount(
  accounts: BusinessSettlementAccount[],
): BusinessSettlementAccount | null {
  if (!accounts.length) {
    return null;
  }

  return (
    accounts.find(
      (account) => account.kind === "checkout" && Number(account.balance ?? 0) > 0,
    ) ||
    accounts.find((account) => account.kind === "checkout") ||
    accounts.find((account) => Number(account.balance ?? 0) > 0) ||
    accounts[0] ||
    null
  );
}

function formatTransferAmountInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");
  const [rawInteger = "", ...rawDecimalParts] = sanitized.split(".");
  const integerDigits = rawInteger.replace(/^0+(?=\d)/, "") || rawInteger;
  const decimalDigits = rawDecimalParts.join("").slice(0, 2);
  const formattedInteger = integerDigits
    ? Number(integerDigits).toLocaleString("en-NG")
    : "";

  if (sanitized.includes(".")) {
    return `${formattedInteger || "0"}.${decimalDigits}`;
  }

  return formattedInteger;
}

export default function WithdrawPage() {
  const router = useRouter();
  const { session } = useBusinessSession();
  const [profile, setProfile] = useState<Business | null>(null);
  const [feeSchedule, setFeeSchedule] = useState<MerchantFeeSchedule | null>(null);
  const [recipients, setRecipients] = useState<RecentBusinessTransfer[]>([]);
  const [banks, setBanks] = useState<Bank[]>(BANKS);
  const [selectedSourceAccount, setSelectedSourceAccount] =
    useState<BusinessSettlementAccount | null>(null);
  const [showSourceAccountList, setShowSourceAccountList] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankSuggestion | null>(null);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [transferPin, setTransferPin] = useState("");
  const [validation, setValidation] = useState<ValidatedTransferAccount | null>(
    null,
  );
  const [validationState, setValidationState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [drawerStep, setDrawerStep] = useState<DrawerStep>(null);
  const [transferPinModalStep, setTransferPinModalStep] =
    useState<TransferPinModalStep>("closed");
  const [transferResult, setTransferResult] = useState<
    Awaited<ReturnType<typeof accountsService.createTransfer>>["data"] | null
  >(null);
  const [transferCompletedAt, setTransferCompletedAt] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBankList, setShowBankList] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const bankListRef = useRef<HTMLDivElement | null>(null);
  const sourceAccountListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!session?.token) {
        return;
      }

      const [profileResponse, recentTransfersResponse, banksResponse, feeScheduleResponse] =
        await Promise.all([
          accountsService.getProfile(session.token),
          accountsService.getRecentTransfers(session.token),
          accountsService.getTransferBanks(session.token),
          paymentsService.getFeeSchedule(session.token),
        ]);

      if (profileResponse.statusCode === 200) {
        setProfile(profileResponse.data);
      }

      if (recentTransfersResponse.statusCode === 200) {
        setRecipients(recentTransfersResponse.data);
      }

      if (banksResponse.statusCode === 200 && banksResponse.data.length) {
        setBanks(banksResponse.data.map(mapMerchantBank));
      }

      if (feeScheduleResponse.statusCode === 200) {
        setFeeSchedule(feeScheduleResponse.data);
      } else {
        setFeeSchedule(null);
      }
    }

    void loadData();
  }, [session?.token]);

  const accounts = useMemo(() => buildBusinessAccounts(profile), [profile]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedSourceAccount) {
      setSelectedSourceAccount(getDefaultWithdrawalAccount(accounts));
    } else if (
      accounts.length > 0 &&
      selectedSourceAccount &&
      !accounts.find((a) => a.id === selectedSourceAccount.id)
    ) {
      setSelectedSourceAccount(getDefaultWithdrawalAccount(accounts));
    }
  }, [accounts, selectedSourceAccount]);

  const activeSourceAccount =
    selectedSourceAccount || getDefaultWithdrawalAccount(accounts);
  const accountDigits = accountNumber.replace(/\D/g, "");
  const suggestions = useMemo(
    () => getBankSuggestions(accountNumber, banks),
    [accountNumber, banks],
  );
  const matchedRecipients = useMemo(() => {
    if (!accountDigits) {
      return [];
    }

    return recipients.filter((recipient) =>
      String(recipient.accountNumber || "")
        .replace(/\D/g, "")
        .includes(accountDigits),
    );
  }, [accountDigits, recipients]);
  const filteredBanks = useMemo(() => {
    const pattern = bankSearchTerm.trim().toLowerCase();
    if (!pattern) {
      return banks;
    }

    return banks.filter((bank) =>
      [bank.name, bank.bankCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(pattern)),
    );
  }, [bankSearchTerm, banks]);
  const numericAmount = Number(amount.replace(/,/g, ""));
  const transferFee = calculateTransferFee(feeSchedule, numericAmount);
  const totalDebit = numericAmount > 0 ? numericAmount + transferFee : 0;
  const hasPaymentPin = Boolean(
    profile?.hasPaymentPin ?? session?.business.hasPaymentPin,
  );
  const suggestedBanks = useMemo(
    () => (accountDigits ? suggestions.slice(0, 6) : []),
    [accountDigits, suggestions],
  );
  const hasVerifiedRecipient =
    validationState === "success" && Boolean(validation?.accountName);
  const verifiedAccountName = validation?.accountName || "";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        showSuggestions &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }

      if (
        showBankList &&
        bankListRef.current &&
        !bankListRef.current.contains(target)
      ) {
        setShowBankList(false);
      }

      if (
        showSourceAccountList &&
        sourceAccountListRef.current &&
        !sourceAccountListRef.current.contains(target)
      ) {
        setShowSourceAccountList(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [showBankList, showSuggestions, showSourceAccountList]);

  useEffect(() => {
    if (!accountDigits || !matchedRecipients.length) {
      setShowBeneficiaries(false);
    }
  }, [accountDigits, matchedRecipients.length]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccount() {
      if (!session?.token || !selectedBank || accountNumber.length !== 10) {
        setValidation(null);
        setValidationState("idle");
        return;
      }

      setValidationState("loading");
      const response = await accountsService.validateTransferAccount(
        session.token,
        {
          accountNumber,
          bankCode: selectedBank.code,
        },
      );

      if (cancelled) {
        return;
      }

      if (response.statusCode === 200) {
        setValidation({
          ...response.data,
          bankCode: selectedBank.code,
          bankName: selectedBank.name,
        });
        setValidationState("success");
      } else {
        setValidation(null);
        setValidationState("error");
      }
    }

    void verifyAccount();
    return () => {
      cancelled = true;
    };
  }, [accountNumber, selectedBank, session?.token]);

  function applyRecipient(recipient: RecentBusinessTransfer) {
    setAccountNumber(formatAccountNumber(recipient.accountNumber || ""));
    setAmount(
      recipient.amount
        ? formatTransferAmountInput(String(recipient.amount))
        : "",
    );

    const matchedBank =
      findBankByCode(recipient.bankCode || "", banks) ||
      banks.find(
        (item) =>
          item.name.toLowerCase() ===
          String(recipient.bankName || "").toLowerCase(),
      );
    if (matchedBank) {
      setSelectedBank({
        name: matchedBank.name,
        code: matchedBank.bankCode,
        logoUrl: getBankLogoUrl(matchedBank.name, matchedBank.logoUrl),
        probability: "high",
      });
    } else if (recipient.bankName) {
      setSelectedBank({
        name: recipient.bankName,
        code: recipient.bankCode || "",
        logoUrl: getBankLogoUrl(recipient.bankName),
        probability: "medium",
      });
    }

    setValidation(null);
    setValidationState("idle");
    setShowBeneficiaries(false);
  }

  function isFormReady() {
    return Boolean(
      activeSourceAccount &&
      selectedBank &&
      validation &&
      validationState === "success" &&
      numericAmount > 0,
    );
  }

  function resetTransferForm() {
    setAccountNumber("");
    setSelectedBank(null);
    setAmount("");
    setNarration("");
    setValidation(null);
    setValidationState("idle");
    setShowSuggestions(false);
    setShowBankList(false);
    setShowBeneficiaries(false);
    setSaveAsBeneficiary(false);
  }

  async function handleTransferConfirmation() {
    if (
      !session?.token ||
      !activeSourceAccount ||
      !selectedBank ||
      !validation?.accountName ||
      !validation.sessionId
    ) {
      toast.error("Complete the transfer form first.");
      return;
    }

    if (!/^\d{6}$/.test(transferPin)) {
      toast.error("Enter your 6-digit transfer PIN to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await accountsService.createTransfer(session.token, {
        accountId: activeSourceAccount.id,
        destinationAccountNumber: accountNumber,
        destinationAccountName: validation.accountName,
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        amount: numericAmount,
        pin: transferPin,
        sessionId: validation.sessionId,
        narration: narration || undefined,
      });

      if (response.statusCode !== 200) {
        toast.error(response.message || "Unable to complete transfer.");
        return;
      }

      setTransferResult(response.data);
      setTransferCompletedAt(new Date().toISOString());
      setDrawerStep("success");
      setTransferPinModalStep("closed");
      setTransferPin("");
      resetTransferForm();
      toast.success(response.message || "Transfer completed successfully.");

      const recentTransfersResponse = await accountsService.getRecentTransfers(
        session.token,
      );
      if (recentTransfersResponse.statusCode === 200) {
        setRecipients(recentTransfersResponse.data);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to complete transfer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadReceipt() {
    if (!transferResult) {
      return;
    }

    try {
      await downloadReceiptPdf(
        {
          amount: transferResult.amount,
          paidAt: transferCompletedAt,
          status: transferResult.status,
          sessionId:
            transferResult.providerReference ||
            transferResult.reference ||
            "--",
          recipientName: transferResult.recipient.accountName,
          bankName: transferResult.recipient.bankName || "--",
          accountNumber: transferResult.recipient.accountNumber,
          sourceBankName: transferResult.sender.bankName,
          sourceAccountNumber: transferResult.sender.accountNumber,
          sourceAccountName:
            transferResult.sender.accountName ||
            activeSourceAccount?.accountName ||
            "--",
          narration: narration || "--",
        },
        `${transferResult.reference}-receipt.pdf`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to download receipt.",
      );
    }
  }

  function closeTransferPinModal() {
    setTransferPinModalStep("closed");
    setTransferPin("");
  }

  function openTransferPinFlow() {
    if (!hasPaymentPin) {
      setTransferPinModalStep("create");
      return;
    }

    setTransferPin("");
    setTransferPinModalStep("enter-pin");
  }

  function goToCreatePin() {
    setDrawerStep(null);
    setTransferPinModalStep("closed");
    setTransferPin("");
    router.push("/dashboard/settings?tab=security&open=create-pin");
  }

  return (
    <MerchantShell
      title="Transfers"
      actions={
        <Link
          href="/dashboard/transactions"
          className="font-semibold text-[var(--brand)]"
        >
          Transfer History
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 xl:ml-0">
        <Link
          href="/dashboard/accounts"
          className="inline-flex w-fit  items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <Card className="dashboard-surface-card overflow-visible p-6 md:p-7">
          <SectionLabel>Recipient Details</SectionLabel>

          <form
            className="mt-6 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isFormReady()) {
                toast.error("Complete the recipient details first.");
                return;
              }
              setDrawerStep("confirm");
            }}
          >
            <div ref={suggestionsRef} className="relative">
              <Input
                placeholder="Enter account number"
                value={accountNumber}
                onFocus={() => {
                  setShowSuggestions(true);
                  setShowBankList(false);
                }}
                onChange={(event) => {
                  const nextValue = formatAccountNumber(event.target.value);
                  setAccountNumber(nextValue);
                  setShowSuggestions(nextValue.replace(/\D/g, "").length > 0);
                  setShowBankList(false);
                  setValidation(null);
                  setValidationState("idle");
                  if (nextValue.length < 10) {
                    setSelectedBank(null);
                  }
                }}
                fieldSize="lg"
                fieldClassName={
                  hasVerifiedRecipient
                    ? "h-[72px] rounded-[8px] border border-[#8dc8aa] bg-[#fbfefc] shadow-[0_0_0_1px_rgba(0,83,48,0.06)]"
                    : "h-[72px] rounded-[8px] border border-[#d8e2ec] bg-[#edf2f8] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                }
                className="text-[18px] font-semibold tracking-[0.01em] text-[#1e293b] md:text-[22px]"
                trailing={
                  validationState === "loading" ? (
                    <SpinnerIcon className="h-5 w-5 animate-spin text-[#667085]" />
                  ) : null
                }
              />

              {showSuggestions && suggestedBanks.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[8px] border border-[var(--border)] bg-white shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                    Suggested banks
                  </div>
                  <div className="max-h-[280px] overflow-y-auto pb-2">
                    {suggestedBanks.map((suggestion) => (
                      <button
                        key={`${suggestion.code}-${suggestion.name}`}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8faf9]"
                        onClick={() => {
                          setSelectedBank(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        <BankAvatar
                          name={suggestion.name}
                          logoUrl={suggestion.logoUrl}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#101828]">
                            {suggestion.name}
                          </span>
                          <span className="mt-1 block text-xs capitalize text-[#667085]">
                            {suggestion.probability || "low"} confidence
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {hasVerifiedRecipient ? (
              <div className="rounded-[8px] border border-[var(--border)] bg-white">
                <ActionRow
                  icon={
                    <span className="text-lg font-bold">
                      {verifiedAccountName
                        .split(" ")
                        .slice(0, 2)
                        .map((item) => item.charAt(0))
                        .join("")
                        .slice(0, 2)}
                    </span>
                  }
                  title={verifiedAccountName}
                  description={`${selectedBank?.name || "--"} • ${accountNumber}`}
                  trailing={<span className="text-lg">›</span>}
                />
                <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-4">
                  <span className="text-sm font-medium text-[#64748b]">
                    Save as beneficiary
                  </span>
                  <Toggle
                    checked={saveAsBeneficiary}
                    onChange={setSaveAsBeneficiary}
                  />
                </div>
              </div>
            ) : null}

            <div
              ref={bankListRef}
              className="relative rounded-[8px] border border-[var(--border)] bg-white p-1"
            >
              <ActionRow
                icon={<BankIcon className="h-5 w-5" />}
                title={selectedBank?.name || "Select Recipient's Bank"}
                description={
                  selectedBank ? "Tap to change destination bank" : undefined
                }
                trailing={<ChevronDown className="h-4 w-4" />}
                onClick={() => {
                  setShowSuggestions(false);
                  setShowBankList((current) => !current);
                  setBankSearchTerm("");
                }}
              />

              {showBankList ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 max-h-[320px] overflow-y-auto rounded-[8px] border border-[var(--border)] bg-white p-2 shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  <div className="px-1 pb-2">
                    <Input
                      value={bankSearchTerm}
                      onChange={(event) =>
                        setBankSearchTerm(event.target.value)
                      }
                      placeholder="Search banks"
                      leftIcon={<SearchIcon className="h-4 w-4" />}
                      fieldSize="lg"
                      fieldClassName="h-[48px] rounded-[8px] border-transparent bg-[#f3f5f8]"
                    />
                  </div>
                  {filteredBanks.map((bank, index) => (
                    <button
                      key={`${bank.bankCode}-${bank.name}-${index}`}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left transition hover:bg-[#f8faf9]"
                      onClick={() => {
                        setSelectedBank({
                          name: bank.name,
                          code: bank.bankCode,
                          logoUrl: getBankLogoUrl(bank.name, bank.logoUrl),
                          probability: "medium",
                        });
                        setShowBankList(false);
                        setBankSearchTerm("");
                      }}
                    >
                      <BankAvatar name={bank.name} logoUrl={bank.logoUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#101828]">
                          {bank.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#98a2b3]">
                          {bank.bankCode}
                        </span>
                      </span>
                    </button>
                  ))}
                  {!filteredBanks.length ? (
                    <p className="px-3 py-4 text-sm text-[#98a2b3]">
                      No banks match your search.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {validationState === "error" ? (
              <p className="text-sm font-medium text-[#d33a44]">
                We couldn&apos;t verify that account with the selected bank yet.
                Check the number or try another bank.
              </p>
            ) : null}

            {matchedRecipients.length ? (
              <div className="rounded-[8px] border border-[var(--border)] bg-white p-1">
                <ActionRow
                  icon={<SearchIcon className="h-5 w-5" />}
                  title="My Beneficiaries"
                  description={`${matchedRecipients.length} recent recipient${matchedRecipients.length === 1 ? "" : "s"} match this account`}
                  trailing={<span className="text-lg">›</span>}
                  onClick={() => setShowBeneficiaries((current) => !current)}
                />
                {showBeneficiaries ? (
                  <div className="border-t border-[var(--border)] px-3 py-3">
                    <div className="grid gap-2">
                      {matchedRecipients.map((recipient) => (
                        <button
                          key={recipient.id}
                          type="button"
                          className="flex items-center justify-between gap-4 rounded-[8px] px-3 py-3 text-left transition hover:bg-[#f8faf9]"
                          onClick={() => applyRecipient(recipient)}
                        >
                          <span>
                            <span className="block font-semibold text-[#273142]">
                              {recipient.name}
                            </span>
                            <span className="mt-1 block text-sm text-[#98a2b3]">
                              {recipient.accountNumber || "--"} •{" "}
                              {recipient.bankName || "--"}
                            </span>
                          </span>
                          <BankAvatar name={recipient.bankName} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasVerifiedRecipient ? (
              <div className="rounded-[8px] border border-[var(--border)] bg-white p-6">
                <SectionLabel>Transfer Details</SectionLabel>
                <div className="mt-6 grid gap-5">
                  <div className="rounded-[8px] bg-[#f8fafc] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] font-medium text-[#64748b]">
                        Amount
                      </span>
                      <input
                        value={amount}
                        onChange={(event) =>
                          setAmount(
                            formatTransferAmountInput(event.target.value),
                          )
                        }
                        placeholder="0.00"
                        inputMode="decimal"
                        className="w-[220px] bg-transparent text-right text-[32px] font-semibold tracking-[-0.04em] text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
                      />
                    </div>
                  </div>

                  {activeSourceAccount ? (
                    <div
                      ref={sourceAccountListRef}
                      className="relative rounded-[8px] border border-[var(--border)] bg-white p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <SectionLabel>Send From</SectionLabel>
                        <span className="text-sm font-semibold text-[#0f1728]">
                          Bal:{" "}
                          {formatCurrency(
                            activeSourceAccount.balance,
                            activeSourceAccount.currency,
                          )}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-4">
                        <div className="border-l-2 border-[var(--brand)] pl-3">
                          <p className="text-[15px] font-semibold text-[#0f1728]">
                            {activeSourceAccount.accountName}
                          </p>
                          <p className="mt-2 text-sm text-[#64748b]">
                            {activeSourceAccount.accountNumber}
                            <span className="ml-2 inline-flex rounded-[6px] bg-[var(--brand-soft)] px-2 py-1 text-xs font-semibold text-[var(--brand)]">
                              {activeSourceAccount.kind === "checkout"
                                ? "Checkout"
                                : activeSourceAccount.kind === "primary"
                                  ? "Primary"
                                  : "Settlement"}
                            </span>
                          </p>
                        </div>
                        {accounts.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setShowSourceAccountList((current) => !current)
                            }
                            className="rounded-[8px] border border-[#cdd7e3] px-4 py-2 text-sm font-semibold text-[#334155]"
                          >
                            Change
                          </button>
                        ) : null}
                      </div>

                      {showSourceAccountList && accounts.length > 1 ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[8px] border border-[var(--border)] bg-white shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                          {accounts.map((account) => (
                            <button
                              key={account.id}
                              type="button"
                              className={`flex w-full items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-4 text-left transition last:border-b-0 ${
                                activeSourceAccount?.id === account.id
                                  ? "bg-[#f6faf7]"
                                  : "hover:bg-[#f8faf9]"
                              }`}
                              onClick={() => {
                                setSelectedSourceAccount(account);
                                setShowSourceAccountList(false);
                              }}
                            >
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-[#101828]">
                                  {account.accountName}
                                </p>
                                <p className="mt-1 text-xs text-[#667085]">
                                  {account.accountNumber} • {account.bankName}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-bold text-[#101828]">
                                  {formatCurrency(
                                    account.balance,
                                    account.currency,
                                  )}
                                </p>
                                {activeSourceAccount?.id === account.id ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)]">
                                    <span className="text-xs font-bold text-white">
                                      ✓
                                    </span>
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <Input
                    label="Narration (Optional)"
                    placeholder="Narration"
                    value={narration}
                    onChange={(event) => setNarration(event.target.value)}
                    fieldSize="lg"
                    fieldClassName="h-[60px] rounded-[8px] border border-[#d8e2ec] bg-[#edf2f8] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  />

                  <Button
                    type="submit"
                    disabled={!isFormReady()}
                    className="mx-auto mt-2 h-[52px] min-w-[190px] rounded-[8px] text-[18px] font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </Card>
      </div>

      {drawerStep ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => {
              setDrawerStep(null);
              closeTransferPinModal();
            }}
            aria-label="Close transfer drawer"
          />
          <aside className="relative h-full w-full max-w-[468px] overflow-y-auto bg-white px-5 py-5 shadow-2xl md:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#273142]">
                {drawerStep === "confirm"
                  ? "Confirm Transfer Details"
                  : "Transfer Successful"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDrawerStep(null);
                  closeTransferPinModal();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eff4fb] text-[#98a2b3]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="my-8 border-t border-dashed border-[#dbe4f0]" />

            {drawerStep === "confirm" ? (
              <>
                <div className="text-center">
                  <p className="text-[24px] font-bold text-[#273142]">
                    {formatCurrency(numericAmount || 0)}
                  </p>
                </div>

                <div className="mt-8 rounded-[20px] bg-[#f8fafb] p-5">
                  <div className="flex items-center justify-between text-[16px] text-[#667085]">
                    <span>Fees</span>
                    <span className="font-semibold text-[#273142]">
                      {formatCurrency(transferFee)}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[16px] text-[#667085]">
                    <span>Total Amount</span>
                    <span className="font-semibold text-[#273142]">
                      {formatCurrency(totalDebit)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] bg-[#f8fafb] p-5">
                  <div className="grid gap-5">
                    <DetailRow
                      label="Recipient"
                      value={validation?.accountName || "--"}
                    />
                    <DetailRow
                      label="Bank Name"
                      value={selectedBank?.name || "--"}
                    />
                    <DetailRow
                      label="Account Number"
                      value={accountNumber || "--"}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] bg-[#f8fafb] p-5">
                  <div className="grid gap-5">
                    <DetailRow
                      label="Sender"
                      value={activeSourceAccount?.accountName || "--"}
                    />
                    <DetailRow
                      label="Bank Name"
                      value={activeSourceAccount?.bankName || "--"}
                    />
                    <DetailRow
                      label="Account Number"
                      value={activeSourceAccount?.accountNumber || "--"}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="dashboard-black-button mt-8 h-[50px] w-full rounded-[14px] text-[18px] font-bold"
                  onClick={openTransferPinFlow}
                >
                  Confirm Transfer
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a] text-[40px] font-bold text-white">
                    ✓
                  </span>
                </div>

                <div className="mt-10 rounded-[20px] bg-[#f8fafb] p-5">
                  <p className="text-[18px] font-bold text-[#273142]">
                    Payment Details
                  </p>
                  <div className="mt-6 grid gap-5">
                    <DetailRow
                      label="Amount"
                      value={formatCurrency(transferResult?.amount || 0)}
                    />
                    <DetailRow
                      label="Recipient"
                      value={transferResult?.recipient.accountName || "--"}
                    />
                    <DetailRow
                      label="Bank Name"
                      value={transferResult?.recipient.bankName || "--"}
                    />
                    <DetailRow
                      label="Account Number"
                      value={transferResult?.recipient.accountNumber || "--"}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="dashboard-black-button mt-8 h-[50px] w-full rounded-[14px] text-[18px] font-bold"
                  onClick={() => void downloadReceipt()}
                >
                  Download Receipt
                </Button>
                <Button
                  type="button"
                  className="mt-4 h-[50px] w-full rounded-[14px] bg-[#f3f5f8] text-[18px] font-semibold text-[#344054] hover:bg-[#eceff4]"
                  onClick={() => setDrawerStep(null)}
                >
                  Close
                </Button>
              </>
            )}
          </aside>
        </div>
      ) : null}

      <Modal
        open={transferPinModalStep !== "closed"}
        onClose={closeTransferPinModal}
        title={
          transferPinModalStep === "create"
            ? "Create your transfer PIN"
            : "Enter transfer PIN"
        }
        description={
          transferPinModalStep === "create"
            ? "You need to create a 6-digit transfer PIN in Settings before you can complete withdrawals."
            : "Enter your 6-digit transfer PIN to authorize this transfer."
        }
        maxWidthClassName="max-w-md"
      >
        {transferPinModalStep === "create" ? (
          <div className="space-y-5">
            <div className="rounded-[18px] bg-[#f8fafb] p-5 text-sm leading-6 text-[#667085]">
              Your transfer PIN is not set yet. Create one in Settings, then
              come back to complete this transfer.
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 border border-[#d0d5dd] bg-white px-5 text-[#344054] hover:bg-[#f8fafb] hover:text-[#1f2937]"
                onClick={closeTransferPinModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="dashboard-black-button h-11 px-5"
                onClick={goToCreatePin}
              >
                Create PIN
              </Button>
            </div>
          </div>
        ) : null}

        {transferPinModalStep === "enter-pin" ? (
          <div className="space-y-5">
            <Input
              label="Transfer PIN"
              type="password"
              value={transferPin}
              onChange={(event) =>
                setTransferPin(
                  event.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              fieldClassName="border-transparent bg-[#f3f5f8]"
              placeholder="Enter 6-digit PIN"
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 border border-[#d0d5dd] bg-white px-5 text-[#344054] hover:bg-[#f8fafb] hover:text-[#1f2937]"
                onClick={closeTransferPinModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={submitting}
                className="dashboard-black-button h-11 px-5"
                onClick={() => void handleTransferConfirmation()}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </MerchantShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[16px]">
      <span className="text-[#667085]">{label}</span>
      <span className="text-right font-semibold text-[#273142]">{value}</span>
    </div>
  );
}
