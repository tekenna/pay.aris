"use client";

import type { BusinessTransaction } from "@/lib/types";
import { apiRequest, withQuery } from "@/services/api-client";

export const transactionsService = {
  getTransactions(token: string, params: URLSearchParams) {
    return apiRequest<BusinessTransaction[]>(
      withQuery("/businesses/transactions", params),
      { token },
    );
  },
  getCheckoutTransactions(token: string, params: URLSearchParams) {
    return apiRequest<BusinessTransaction[]>(
      withQuery("/businesses/checkout-transactions", params),
      { token },
    );
  },
};
