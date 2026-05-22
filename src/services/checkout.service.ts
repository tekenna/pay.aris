"use client";

import type { CheckoutSession } from "@/lib/types";
import { apiRequest, withQuery } from "@/services/api-client";

export const checkoutService = {
  getVirtualAccounts(token: string, params: URLSearchParams) {
    return apiRequest<CheckoutSession[]>(
      withQuery("/businesses/virtual-accounts", params),
      { token },
    );
  },
  getCheckoutSession(
    reference: string,
    params?: { amount?: number; attemptReference?: string | null },
  ) {
    const searchParams = new URLSearchParams();
    if (params?.amount) {
      searchParams.set("amount", String(params.amount));
    }
    if (params?.attemptReference) {
      searchParams.set("attemptReference", params.attemptReference);
    }

    return apiRequest<CheckoutSession & { session?: CheckoutSession }>(
      withQuery(`/checkout/${reference}`, searchParams),
    );
  },
  verifyCheckout(reference: string, body: { amount?: number }) {
    return apiRequest<{
      reference: string;
      amount?: number | null;
      currency: string;
      status: string;
      expiresAt?: string | null;
      virtualAccount?: CheckoutSession["virtualAccount"];
      session: CheckoutSession;
    }>(`/checkout/${reference}/verify`, {
      method: "POST",
      data: body,
    });
  },
  verifyPayment(
    reference: string,
    params?: { attemptReference?: string | null },
  ) {
    const searchParams = new URLSearchParams();
    if (params?.attemptReference) {
      searchParams.set("attemptReference", params.attemptReference);
    }

    return apiRequest<{
      reference: string;
      attemptReference?: string | null;
      status: string;
      amount: number;
      currency: string;
      paidAt?: string | null;
      expiresAt?: string | null;
      callbackUrl?: string | null;
      virtualAccount?: {
        accountNumber?: string | null;
        accountName?: string | null;
        bankName?: string | null;
      };
    }>(withQuery(`/payments/verify/${reference}`, searchParams));
  },
};
