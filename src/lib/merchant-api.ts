import type {
  ApiResponse,
  AuditLog,
  Business,
  BusinessAccountLedgerEntry,
  MerchantBank,
  BusinessSession,
  BusinessSettlementAccount,
  BusinessTeamMember,
  BusinessTransaction,
  CheckoutConfig,
  CheckoutSession,
  MerchantDashboardOverview,
  RecentBusinessTransfer,
  ValidatedTransferAccount,
  WebhookConfig,
  WebhookLog,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://aris-api-ftgj.onrender.com/api";
const SESSION_KEY = "aris-pay.business.session";
const REGISTRATION_KEY = "aris-pay.business.registration";
const SESSION_EVENT = "aris-pay:session-updated";

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(REGISTRATION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  window.location.replace("/login");
}

function getStoredSession(): BusinessSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      return null;
    }

    return JSON.parse(storedSession) as BusinessSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

function setStoredSession(session: BusinessSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

let refreshPromise: Promise<string | null> | null = null;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  token?: string;
  retryOnAuthFailure?: boolean;
};

async function refreshBusinessAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentSession = getStoredSession();
    if (!currentSession?.refreshToken) {
      clearStoredSession();
      return null;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/business-auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
        cache: "no-store",
      });
    } catch {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as ApiResponse<BusinessSession> | null;

    if (!payload || payload.statusCode !== 200 || !payload.data?.token) {
      clearStoredSession();
      return null;
    }

    const nextSession: BusinessSession = {
      business: payload.data.business,
      token: payload.data.token,
      refreshToken: payload.data.refreshToken || currentSession.refreshToken,
    };
    setStoredSession(nextSession);
    return nextSession.token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function request<T>(
  path: string,
  { method = "GET", body, token, retryOnAuthFailure = true }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  let response: Response;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to connect to Aris Wallex API.");
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    throw new Error("Unexpected API response.");
  }

  const isRestricted =
    response.status === 403 || response.status === 401 || payload?.statusCode === 403 || payload?.statusCode === 401;

  if (token && retryOnAuthFailure && isRestricted && path !== "/business-auth/refresh") {
    const refreshedToken = await refreshBusinessAccessToken();
    if (refreshedToken) {
      return request<T>(path, {
        method,
        body,
        token: refreshedToken,
        retryOnAuthFailure: false,
      });
    }

    clearStoredSession();
    redirectToLogin();
    return payload;
  }

  return payload;
}

export const merchantApi = {
  verifyEmail(emailAddress: string) {
    return request<{ otpId?: string; recipient?: string }>("/business-auth/verify-email", {
      method: "POST",
      body: { emailAddress },
    });
  },
  verifyOtp(otpId: string, otp: string) {
    return request<{ business: Business; token: string }>("/business-auth/verify-otp", {
      method: "POST",
      body: { otpId, otp },
    });
  },
  resendOtp(otpId: string) {
    return request<{ otpId?: string; recipient?: string }>("/business-auth/resend-otp", {
      method: "POST",
      body: { otpId },
    });
  },
  registerBusiness(body: Record<string, unknown>) {
    return request<{ business: Business; token: string }>("/business-auth/register", {
      method: "POST",
      body,
    });
  },
  login(emailAddress: string, password: string) {
    return request<BusinessSession>("/business-auth/login", {
      method: "POST",
      body: { emailAddress, password },
    });
  },
  previewInvitation(token: string) {
    return request<{
      businessName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      emailAddress?: string | null;
      role?: string | null;
      status?: string | null;
    }>("/business-auth/invitation/preview", {
      method: "POST",
      body: { token },
    });
  },
  acceptInvitation(token: string, password: string) {
    return request<{ member: BusinessTeamMember }>("/business-auth/invitation/accept", {
      method: "POST",
      body: { token, password },
    });
  },
  getProfile(token: string) {
    return request<Business>("/businesses/profile", { token });
  },
  updateProfile(token: string, body: Record<string, unknown>) {
    return request<Business>("/businesses/profile", { method: "PUT", token, body });
  },
  initiateBusinessIdentity(
    token: string,
    body: { identityType: string; identityNumber: string },
  ) {
    return request<{ identityId?: string; otpId?: string | null }>(
      "/businesses/kyc/identity/initiate",
      { method: "POST", token, body },
    );
  },
  validateBusinessIdentity(
    token: string,
    body: { identityType: string; identityId: string; otp: string },
  ) {
    return request<{ identityId: string; verified: boolean; business: Business; safehaven?: unknown }>(
      "/businesses/kyc/identity/validate",
      { method: "POST", token, body },
    );
  },
  submitCorporateKyc(
    token: string,
    body: {
      identityType: string;
      identityNumber: string;
      identityId: string;
      cac: File;
    },
  ) {
    const formData = new FormData();
    formData.append("identityType", body.identityType);
    formData.append("identityNumber", body.identityNumber);
    formData.append("identityId", body.identityId);
    formData.append("cac", body.cac);

    return request<Business>("/businesses/kyc/corporate", {
      method: "POST",
      token,
      body: formData,
    });
  },
  getDashboardOverview(token: string, days = 7) {
    return request<MerchantDashboardOverview>(
      `/businesses/dashboard/overview?days=${days}`,
      { token },
    );
  },
  getTransactions(token: string, params: URLSearchParams) {
    return request<BusinessTransaction[]>(
      `/businesses/transactions?${params.toString()}`,
      { token },
    );
  },
  getCheckoutTransactions(token: string, params: URLSearchParams) {
    return request<BusinessTransaction[]>(
      `/businesses/checkout-transactions?${params.toString()}`,
      { token },
    );
  },
  getVirtualAccounts(token: string, params: URLSearchParams) {
    return request<CheckoutSession[]>(
      `/businesses/virtual-accounts?${params.toString()}`,
      { token },
    );
  },
  getPayments(token: string, params: URLSearchParams) {
    return request<CheckoutSession[]>(
      `/businesses/payments?${params.toString()}`,
      { token },
    );
  },
  createPaymentLink(token: string, body: Record<string, unknown>) {
    return request<{
      reference: string;
      checkout_url: string;
      status: string;
      session: CheckoutSession;
    }>("/businesses/checkout-links", {
      method: "POST",
      token,
      body,
    });
  },
  updatePaymentLink(token: string, sessionId: string, body: Record<string, unknown>) {
    return request<CheckoutSession>(`/businesses/checkout-links/${sessionId}`, {
      method: "PUT",
      token,
      body,
    });
  },
  getApiKeys(token: string) {
    return request<{ test: unknown; live: unknown }>("/businesses/api-keys", { token });
  },
  generateApiKeys(token: string, environment: "test" | "live") {
    return request<{ publicKey: string; secretKey: string; environment: string }>(
      "/businesses/api-keys/generate",
      {
        method: "POST",
        token,
        body: { environment },
      },
    );
  },
  regenerateApiKey(token: string, environment: "test" | "live") {
    return request<{ publicKey: string; secretKey: string; environment: string }>(
      `/businesses/api-keys/${environment}/regenerate`,
      { method: "POST", token },
    );
  },
  revokeApiKey(token: string, environment: "test" | "live") {
    return request<null>(`/businesses/api-keys/${environment}/revoke`, {
      method: "POST",
      token,
    });
  },
  getCheckoutConfig(token: string) {
    return request<CheckoutConfig>("/businesses/checkout-config", { token });
  },
  getAccountById(token: string, accountId: string, params: URLSearchParams) {
    return request<{
      account: BusinessSettlementAccount;
      ledger: BusinessAccountLedgerEntry[];
    }>(`/businesses/accounts/${accountId}?${params.toString()}`, { token });
  },
  getRecentTransfers(token: string) {
    return request<RecentBusinessTransfer[]>("/businesses/transfers/recents", { token });
  },
  getTransferBanks(token: string) {
    return request<MerchantBank[]>("/businesses/transfers/banks", { token });
  },
  validateTransferAccount(
    token: string,
    body: { accountNumber: string; bankCode: string },
  ) {
    return request<ValidatedTransferAccount>("/businesses/transfers/name-inquiry", {
      method: "POST",
      token,
      body,
    });
  },
  createTransfer(
    token: string,
    body: {
      accountId: "primary" | "checkout";
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
    return request<{
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
      body,
    });
  },
  updateCheckoutConfig(token: string, body: Record<string, unknown>) {
    return request<CheckoutConfig>("/businesses/checkout-config", {
      method: "PUT",
      token,
      body,
    });
  },
  getTeamMembers(token: string) {
    return request<BusinessTeamMember[]>("/businesses/team-members", { token });
  },
  inviteTeamMember(
    token: string,
    body: {
      firstName: string;
      lastName: string;
      emailAddress: string;
      phoneNumber: string;
      role: "admin" | "support" | "developer";
    },
  ) {
    return request<BusinessTeamMember>("/businesses/team-members/invite", {
      method: "POST",
      token,
      body,
    });
  },
  verifySecurityPassword(token: string, password: string) {
    return request<{ hasPaymentPin: boolean }>("/businesses/security/password/verify", {
      method: "POST",
      token,
      body: { password },
    });
  },
  createPaymentPin(token: string, body: { password: string; pin: string; confirmPin: string }) {
    return request<{ hasPaymentPin: boolean }>("/businesses/security/pin/create", {
      method: "POST",
      token,
      body,
    });
  },
  changePaymentPin(
    token: string,
    body: {
      password: string;
      oldPin: string;
      newPin: string;
      confirmNewPin: string;
    },
  ) {
    return request<{ hasPaymentPin: boolean }>("/businesses/security/pin/change", {
      method: "POST",
      token,
      body,
    });
  },
  getWebhookConfig(token: string) {
    return request<WebhookConfig>("/businesses/webhooks", { token });
  },
  updateWebhookConfig(token: string, body: Record<string, unknown>) {
    return request<WebhookConfig>("/businesses/webhooks", {
      method: "PUT",
      token,
      body,
    });
  },
  getWebhookLogs(token: string, params: URLSearchParams) {
    return request<WebhookLog[]>(
      `/businesses/webhooks/logs?${params.toString()}`,
      { token },
    );
  },
  retryWebhook(token: string, logId: string, reason?: string) {
    return request<WebhookLog>(`/businesses/webhooks/logs/${logId}/retry`, {
      method: "POST",
      token,
      body: { reason },
    });
  },
  getAuditLogs(token: string, params: URLSearchParams) {
    return request<AuditLog[]>(`/businesses/audit-logs?${params.toString()}`, {
      token,
    });
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
    const query = searchParams.toString();
    return request<CheckoutSession & { session?: CheckoutSession }>(
      `/checkout/${reference}${query ? `?${query}` : ""}`,
    );
  },
  verifyCheckout(reference: string, body: { amount?: number }) {
    return request<{
      reference: string;
      amount?: number | null;
      currency: string;
      status: string;
      expiresAt?: string | null;
      virtualAccount?: CheckoutSession["virtualAccount"];
      session: CheckoutSession;
    }>(`/checkout/${reference}/verify`, {
      method: "POST",
      body,
    });
  },
  verifyPayment(reference: string, params?: { attemptReference?: string | null }) {
    const searchParams = new URLSearchParams();
    if (params?.attemptReference) {
      searchParams.set("attemptReference", params.attemptReference);
    }
    const query = searchParams.toString();
    return request<{
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
    }>(`/payments/verify/${reference}${query ? `?${query}` : ""}`);
  },
};
