"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { TransactionReceipt } from "@/components/checkout/transaction-receipt";
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
import { merchantApi } from "@/lib/merchant-api";
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
  MerchantBank,
  RecentBusinessTransfer,
  ValidatedTransferAccount,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useBusinessSession } from "@/store/business-session-provider";

type DrawerStep = "confirm" | "success" | null;
type TransferPinModalStep = "closed" | "create" | "enter-pin";

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
  const accounts: BusinessSettlementAccount[] = [];

  if (profile?.kyc?.settlementAccountNumber) {
    accounts.push({
      id: "primary",
      bankName: profile.safehaven?.bankName || "Safehaven MFB",
      bankCode: profile.safehaven?.bankCode || null,
      accountNumber: profile.kyc.settlementAccountNumber,
      accountName:
        profile.kyc?.settlementAccountName ||
        profile.businessName ||
        "Settlement Account",
      balance: Number(
        profile.safehaven?.meta?.availableBalance ??
          profile.safehaven?.meta?.balance ??
          0,
      ),
      currency: "NGN",
      status: profile.safehaven?.status || "active",
    });
  }

  if (profile?.safehavenCheckout?.accountNumber) {
    accounts.push({
      id: "checkout",
      bankName: profile.safehavenCheckout.bankName || "Safehaven MFB",
      bankCode: profile.safehavenCheckout.bankCode || null,
      accountNumber: profile.safehavenCheckout.accountNumber,
      accountName:
        profile.safehavenCheckout.accountName ||
        `${profile.businessName || "Business"} Checkout`,
      balance: Number(
        profile.safehavenCheckout?.meta?.availableBalance ??
          profile.safehavenCheckout?.meta?.balance ??
          0,
      ),
      currency: "NGN",
      status: profile.safehavenCheckout.status || "active",
    });
  }

  return accounts;
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
  const [recipients, setRecipients] = useState<RecentBusinessTransfer[]>([]);
  const [banks, setBanks] = useState<Bank[]>(BANKS);
  const [selectedSourceAccount, setSelectedSourceAccount] =
    useState<BusinessSettlementAccount | null>(null);
  const [showSourceAccountList, setShowSourceAccountList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    Awaited<ReturnType<typeof merchantApi.createTransfer>>["data"] | null
  >(null);
  const [transferCompletedAt, setTransferCompletedAt] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBankList, setShowBankList] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const bankListRef = useRef<HTMLDivElement | null>(null);
  const sourceAccountListRef = useRef<HTMLDivElement | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!session?.token) {
        return;
      }

      const [profileResponse, recentTransfersResponse, banksResponse] =
        await Promise.all([
          merchantApi.getProfile(session.token),
          merchantApi.getRecentTransfers(session.token),
          merchantApi.getTransferBanks(session.token),
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
    }

    void loadData();
  }, [session?.token]);

  const accounts = useMemo(() => buildBusinessAccounts(profile), [profile]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedSourceAccount) {
      setSelectedSourceAccount(accounts[0]);
    } else if (
      accounts.length > 0 &&
      selectedSourceAccount &&
      !accounts.find((a) => a.id === selectedSourceAccount.id)
    ) {
      setSelectedSourceAccount(accounts[0]);
    }
  }, [accounts, selectedSourceAccount]);

  const activeSourceAccount = selectedSourceAccount || accounts[0] || null;
  const suggestions = useMemo(
    () => getBankSuggestions(accountNumber, banks),
    [accountNumber, banks],
  );
  const filteredRecipients = useMemo(() => {
    const pattern = searchTerm.trim().toLowerCase();
    if (!pattern) {
      return recipients;
    }

    return recipients.filter((recipient) =>
      [recipient.name, recipient.accountNumber, recipient.bankName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(pattern)),
    );
  }, [recipients, searchTerm]);
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
  const transferFee = 100;
  const totalDebit = numericAmount > 0 ? numericAmount + transferFee : 0;
  const hasPaymentPin = Boolean(
    profile?.hasPaymentPin ?? session?.business.hasPaymentPin,
  );

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
    let cancelled = false;

    async function verifyAccount() {
      if (!session?.token || !selectedBank || accountNumber.length !== 10) {
        setValidation(null);
        setValidationState("idle");
        return;
      }

      setValidationState("loading");
      const response = await merchantApi.validateTransferAccount(
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
      const response = await merchantApi.createTransfer(session.token, {
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
      toast.success(response.message || "Transfer completed successfully.");

      const recentTransfersResponse = await merchantApi.getRecentTransfers(
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
    if (!transferResult || !receiptRef.current) {
      return;
    }

    try {
      await downloadReceiptPdf(
        receiptRef.current,
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
    <MerchantShell title="Withdraw">
      <Link
        href="/dashboard/accounts"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <Card className="rounded-[24px] border-[#dde3ea] p-6 md:p-8">
          <p className="text-[15px] font-semibold text-[#667085]">
            Add Recipient Details
          </p>

          {activeSourceAccount ? (
            <div ref={sourceAccountListRef} className="relative mt-5">
              {accounts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceAccountList((current) => !current);
                  }}
                  className="w-full rounded-[16px] border border-[#e4e7ec] bg-[#f8fafb] px-4 py-4 text-left transition hover:bg-[#f0f2f5]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
                    Sending from
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#101828]">
                        {activeSourceAccount.accountName}
                      </p>
                      <p className="mt-1 text-xs text-[#667085]">
                        {activeSourceAccount.accountNumber} •{" "}
                        {activeSourceAccount.bankName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-[#101828]">
                        {formatCurrency(
                          activeSourceAccount.balance,
                          activeSourceAccount.currency,
                        )}
                      </p>
                      <ChevronDown className="h-4 w-4 text-[#667085]" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="rounded-[16px] border border-[#e4e7ec] bg-[#f8fafb] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
                    Sending from
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#101828]">
                        {activeSourceAccount.accountName}
                      </p>
                      <p className="mt-1 text-xs text-[#667085]">
                        {activeSourceAccount.accountNumber} •{" "}
                        {activeSourceAccount.bankName}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#101828]">
                      {formatCurrency(
                        activeSourceAccount.balance,
                        activeSourceAccount.currency,
                      )}
                    </p>
                  </div>
                </div>
              )}

              {showSourceAccountList && accounts.length > 1 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[16px] border border-[#e4e7ec] bg-white shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      className={`flex w-full items-center justify-between gap-4 border-b border-[#e4e7ec] px-4 py-4 text-left transition last:border-b-0 ${
                        activeSourceAccount?.id === account.id
                          ? "bg-[#f0f7ff]"
                          : "hover:bg-[#f8fafb]"
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
                          {formatCurrency(account.balance, account.currency)}
                        </p>
                        {activeSourceAccount?.id === account.id ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0a9550]">
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
                label="Enter Recipient Account Number"
                placeholder="e.g 0123456789"
                value={accountNumber}
                onFocus={() => {
                  setShowSuggestions(true);
                  setShowBankList(false);
                }}
                onChange={(event) => {
                  const nextValue = formatAccountNumber(event.target.value);
                  setAccountNumber(nextValue);
                  setShowSuggestions(true);
                  setShowBankList(false);
                  setValidation(null);
                  setValidationState("idle");
                  if (nextValue.length < 10) {
                    setSelectedBank(null);
                  }
                }}
                fieldSize="lg"
                fieldClassName={
                  validationState === "success"
                    ? "h-[60px] rounded-[14px] border-[#66c39b] bg-white shadow-[0_0_0_1px_rgba(102,195,155,0.2)]"
                    : "h-[60px] rounded-[14px] border-transparent bg-[#f3f5f8]"
                }
                trailing={
                  validationState === "loading" ? (
                    <SpinnerIcon className="h-5 w-5 animate-spin text-[#667085]" />
                  ) : validation?.accountName ? (
                    <span className="inline-flex rounded-[8px] bg-[#e8f6ef] px-3 py-1 text-xs font-semibold text-[#0a9550]">
                      {validation.accountName}
                    </span>
                  ) : null
                }
              />

              {showSuggestions && suggestions.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[18px] border border-[#e4e7ec] bg-white shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
                    Suggested banks
                  </div>
                  <div className="max-h-[280px] overflow-y-auto pb-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.code}-${suggestion.name}`}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8fafb]"
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

            <div ref={bankListRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setShowBankList((current) => !current);
                  setBankSearchTerm("");
                }}
                className="flex h-[60px] w-full items-center justify-between rounded-[14px] border border-transparent bg-[#f3f5f8] px-4 text-left transition focus:outline-none focus:ring-1 focus:ring-[#9fc5ff]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {selectedBank ? (
                    <BankAvatar
                      name={selectedBank.name}
                      logoUrl={selectedBank.logoUrl}
                      className="h-10 w-10 bg-white"
                    />
                  ) : null}
                  <span
                    className={`text-[14px] font-semibold ${selectedBank ? "text-[#273142]" : "text-[#667085]"}`}
                  >
                    {selectedBank?.name || "Select Bank"}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-[#667085]" />
              </button>

              {showBankList ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 max-h-[280px] overflow-y-auto rounded-[18px] border border-[#e4e7ec] bg-white p-2 shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  <div className="px-1 pb-2">
                    <Input
                      value={bankSearchTerm}
                      onChange={(event) =>
                        setBankSearchTerm(event.target.value)
                      }
                      placeholder="Search banks"
                      leftIcon={<SearchIcon className="h-4 w-4" />}
                      fieldSize="lg"
                      fieldClassName="h-[48px] rounded-[12px] border-transparent bg-[#f3f5f8]"
                    />
                  </div>
                  {filteredBanks.map((bank, index) => (
                    <button
                      key={`${bank.bankCode}-${bank.name}-${index}`}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition hover:bg-[#f8fafb]"
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

            {validationState === "success" && validation?.accountName ? (
              <div className="rounded-[14px] border border-[#66c39b] bg-[#f4fcf7] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0a9550]">
                  Verified Account
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">
                      {validation.accountName}
                    </p>
                    <p className="mt-1 text-xs text-[#667085]">
                      {accountNumber} • {selectedBank?.name}
                    </p>
                  </div>
                  {selectedBank ? (
                    <BankAvatar
                      name={selectedBank.name}
                      logoUrl={selectedBank.logoUrl}
                      className="h-11 w-11 bg-white"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <Input
              label="Amount"
              placeholder="e.g 5000"
              value={amount}
              onChange={(event) =>
                setAmount(formatTransferAmountInput(event.target.value))
              }
              fieldSize="lg"
              fieldClassName="h-[60px] rounded-[14px] border-transparent bg-[#f3f5f8]"
            />
            <Input
              label="Narration(Optional)"
              placeholder="e.g Office supplies payment"
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
              fieldSize="lg"
              fieldClassName="h-[60px] rounded-[14px] border-transparent bg-[#f3f5f8]"
            />

            <Button
              type="submit"
              disabled={!isFormReady()}
              className="ml-auto h-[54px] min-w-[150px] rounded-[14px] bg-[#1d1d1f] text-[20px] font-bold disabled:bg-[#98a2b3]"
            >
              Continue
            </Button>
          </form>
        </Card>

        <Card className="rounded-[24px] border-[#dde3ea] p-5 md:p-6">
          <p className="text-[15px] font-semibold text-[#667085]">
            Recent Transfers
          </p>
          <div className="mt-5">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by Name"
              leftIcon={<SearchIcon className="h-5 w-5" />}
              fieldSize="lg"
              fieldClassName="h-[54px] rounded-[14px] border-transparent bg-[#f3f5f8]"
            />
          </div>

          <div className="mt-6 grid gap-5">
            {filteredRecipients.map((recipient) => (
              <button
                key={recipient.id}
                type="button"
                className="flex items-center justify-between gap-4 text-left"
                onClick={() => applyRecipient(recipient)}
              >
                <div>
                  <p className="font-semibold text-[#273142]">
                    {recipient.name}
                  </p>
                  <p className="mt-1 text-sm text-[#98a2b3]">
                    {recipient.accountNumber || "--"} -{" "}
                    {recipient.bankName || "--"}
                  </p>
                </div>
                <BankAvatar name={recipient.bankName} />
              </button>
            ))}

            {!filteredRecipients.length ? (
              <p className="text-sm text-slate-400">
                Recent transfers will appear here once you complete a transfer.
              </p>
            ) : null}
          </div>
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

      {transferResult ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-200vw] top-0 opacity-0"
        >
          <div ref={receiptRef}>
            <TransactionReceipt
              amount={transferResult.amount}
              paidAt={transferCompletedAt}
              status={transferResult.status}
              sessionId={
                transferResult.providerReference ||
                transferResult.reference ||
                "--"
              }
              recipientName={transferResult.recipient.accountName}
              bankName={transferResult.recipient.bankName || "--"}
              accountNumber={transferResult.recipient.accountNumber}
              sourceBankName={transferResult.sender.bankName}
              sourceAccountName={transferResult.sender.accountNumber}
              narration={narration || "--"}
            />
          </div>
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
              Your transfer PIN is not set yet. Create one in Settings, then come back to
              complete this transfer.
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
                setTransferPin(event.target.value.replace(/\D/g, "").slice(0, 6))
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
