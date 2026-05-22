"use client";

import type {
  Business,
  BusinessAccountLedgerEntry,
  BusinessSettlementAccount,
  MerchantBank,
  RecentBusinessTransfer,
  ValidatedTransferAccount,
} from "@/lib/types";
import { apiRequest } from "@/services/api-client";

export const accountsService = {
  getProfile(token: string) {
    return apiRequest<Business>("/businesses/profile", { token });
  },
  getAccountById(token: string, accountId: string, params: URLSearchParams) {
    const query = params.toString();
    return apiRequest<{
      account: BusinessSettlementAccount;
      ledger: BusinessAccountLedgerEntry[];
    }>(`/businesses/accounts/${accountId}${query ? `?${query}` : ""}`, { token });
  },
  createSettlementAccount(token: string, body: { accountName: string }) {
    return apiRequest<BusinessSettlementAccount>("/businesses/accounts", {
      method: "POST",
      token,
      data: body,
    });
  },
  getRecentTransfers(token: string) {
    return apiRequest<RecentBusinessTransfer[]>("/businesses/transfers/recents", {
      token,
    });
  },
  getTransferBanks(token: string) {
    return apiRequest<MerchantBank[]>("/businesses/transfers/banks", { token });
  },
  validateTransferAccount(
    token: string,
    body: { accountNumber: string; bankCode: string },
  ) {
    return apiRequest<ValidatedTransferAccount>(
      "/businesses/transfers/name-inquiry",
      {
        method: "POST",
        token,
        data: body,
      },
    );
  },
  createTransfer(
    token: string,
    body: {
      accountId: string;
      destinationAccountNumber: string;
      destinationAccountName: string;
      bankCode: string;
      bankName?: string;
      amount: number;
      pin: string;
      sessionId: string;
      narration?: string;
    },
  ) {
    return apiRequest<{
      reference: string;
      providerReference?: string | null;
      status: string;
      amount: number;
      fee: number;
      totalDebit: number;
      recipient: {
        accountName: string;
        accountNumber: string;
        bankName?: string | null;
        bankCode: string;
      };
      sender: {
        accountId: "primary" | "checkout";
        accountName: string;
        accountNumber: string;
        bankName: string;
      };
    }>("/businesses/transfers", {
      method: "POST",
      token,
      data: body,
    });
  },
};
