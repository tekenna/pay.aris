"use client";

import type {
  BusinessTransaction,
  CheckoutSession,
  MerchantFeeSchedule,
} from "@/lib/types";
import { apiRequest, withQuery } from "@/services/api-client";

export const paymentsService = {
  getPayments(token: string, params: URLSearchParams) {
    return apiRequest<CheckoutSession[]>(
      withQuery("/businesses/payments", params),
      { token },
    );
  },
  getPaymentById(token: string, sessionId: string) {
    return apiRequest<CheckoutSession>(`/businesses/payments/${sessionId}`, {
      token,
    });
  },
  getFeeSchedule(token: string) {
    return apiRequest<MerchantFeeSchedule>("/businesses/fees", { token });
  },
  createPaymentLink(token: string, body: Record<string, unknown>) {
    return apiRequest<{
      reference: string;
      checkout_url: string;
      status: string;
      session: CheckoutSession;
    }>("/businesses/checkout-links", {
      method: "POST",
      token,
      data: body,
    });
  },
  updatePaymentLink(
    token: string,
    sessionId: string,
    body: Record<string, unknown>,
  ) {
    return apiRequest<CheckoutSession>(`/businesses/checkout-links/${sessionId}`, {
      method: "PUT",
      token,
      data: body,
    });
  },
  getTransactions(token: string, params: URLSearchParams) {
    return apiRequest<BusinessTransaction[]>(
      withQuery("/businesses/transactions", params),
      { token },
    );
  },
};
