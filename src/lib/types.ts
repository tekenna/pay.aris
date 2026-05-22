export type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type Business = {
  _id?: string;
  businessName?: string | null;
  legalName?: string | null;
  emailAddress: string;
  hasPaymentPin?: boolean;
  businessTierLevel?: 1 | 2 | 3;
  currentTier?: "TIER_1" | "TIER_2" | "TIER_3";
  tierLimits?: {
    tier: 1 | 2 | 3;
    key: "TIER_1" | "TIER_2" | "TIER_3";
    name: string;
    perTransactionLimit: number;
    dailyLimit: number;
  };
  currentRole?: "owner" | "admin" | "support" | "developer";
  currentUser?: {
    _id?: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
    phoneNumber?: string | null;
    role?: "owner" | "admin" | "support" | "developer";
    type?: "owner" | "team_member";
  };
  phoneNumber?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  status?: string | null;
  onboardingStage?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
  };
  kyc?: {
    status?: string | null;
    rcNumber?: string | null;
    taxId?: string | null;
    settlementAccountName?: string | null;
    settlementAccountNumber?: string | null;
    identityType?: string | null;
    identityNumber?: string | null;
    identityId?: string | null;
    documents?: Array<{
      type: string;
      url: string;
      identifier?: string | null;
    }>;
    submittedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
  };
  apiKeys?: {
    test?: ApiKeyEnvironment;
    live?: ApiKeyEnvironment;
  };
  checkoutConfig?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    callbackUrl?: string | null;
    webhookUrl?: string | null;
  };
  webhook?: {
    url?: string | null;
    enabled?: boolean;
    events?: string[];
    secret?: string | null;
    lastDeliveryAt?: string | null;
  };
  safehaven?: {
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    status?: string | null;
    meta?: Record<string, unknown> | null;
  };
  safehavenCheckout?: {
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    status?: string | null;
    meta?: Record<string, unknown> | null;
  };
  settlementAccounts?: BusinessSettlementAccount[];
  teamMembers?: BusinessTeamMember[];
};

export type BusinessTeamMember = {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress: string;
  phoneNumber?: string | null;
  role: "owner" | "admin" | "support" | "developer";
  status?: string | null;
  emailVerified?: boolean;
  invitedAt?: string | null;
  invitationAcceptedAt?: string | null;
  lastLoginAt?: string | null;
};

export type ApiKeyEnvironment = {
  publicKey?: string | null;
  secretKeyPreview?: string | null;
  status?: string | null;
  createdAt?: string | null;
  lastRotatedAt?: string | null;
  revokedAt?: string | null;
};

export type BusinessSession = {
  token: string;
  refreshToken?: string;
  business: Business;
};

export type RegistrationDraft = {
  emailAddress?: string;
  otpId?: string;
  token?: string;
  businessName?: string;
  legalName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  phoneNumber?: string;
  taxIdentificationNumber?: string;
  website?: string;
  industry?: string;
  description?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  addressPostalCode?: string;
};

export type MerchantDashboardOverview = {
  periodDays: number;
  metrics: {
    totalTransactions: number;
    customerTransactions?: number;
    totalCheckoutSessions: number;
    totalVolume: number;
    grossVolume?: number;
    requestedVolume?: number;
    totalRevenue?: number;
    totalFees?: number;
    netRevenue?: number;
    settlementCreditsVolume?: number;
    transferOutflow?: number;
    availableBalance?: number;
    primaryAvailableBalance?: number;
    checkoutAvailableBalance?: number;
    successfulPayments?: number;
    failedTransactions?: number;
    conversionRate?: number;
    statusBreakdown: {
      success: number;
      pending: number;
      failed: number;
    };
  };
  revenueTrend?: Array<{
    label: string;
    gross: number;
    net: number;
    fees?: number;
    requestedAmount?: number;
    successfulPayments: number;
    checkoutSessions: number;
  }>;
  recentActivity: BusinessTransaction[];
  sourcePerformance?: Array<{
    source: "payment_link" | "api_checkout" | string;
    label: string;
    checkoutSessions: number;
    successfulPayments: number;
    pendingSessions: number;
    failedSessions: number;
    successRate: number;
    volume: number;
    grossVolume: number;
  }>;
  issueBreakdown?: Array<{
    label: string;
    count: number;
  }>;
  bankPerformance?: Array<{
    bankName: string;
    successfulPayments: number;
    pendingSessions: number;
    failedSessions: number;
    totalVolume: number;
    totalTransactions: number;
    successRate: number;
    pendingRate: number;
    failedRate: number;
  }>;
};

export type BusinessTransaction = {
  _id: string;
  checkoutSession?: string | null;
  reference: string;
  providerReference?: string | null;
  status: string;
  amount: number;
  currency: string;
  direction?: "credit" | "debit" | string | null;
  category?: "payment_link" | "checkout" | "transfer" | "checkout_fee" | string | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  paymentMethod?: string | null;
  channel?: string | null;
  sourceType?: "payment_link" | "api_checkout" | string | null;
  narration?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    accountNumber?: string | null;
  };
  settlementAccount?: {
    accountId?: string | null;
    alias?: string | null;
    kind?: "primary" | "checkout" | "custom" | string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    currency?: string | null;
    status?: string | null;
  } | null;
  virtualAccount?: {
    accountNumber?: string | null;
    accountName?: string | null;
    bankName?: string | null;
  };
  payload?: Record<string, unknown> | null;
};

export type BusinessSettlementAccount = {
  id: string;
  alias?: string | null;
  kind?: "primary" | "checkout" | "custom";
  bankName: string;
  bankCode?: string | null;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  status: string;
  isDefault?: boolean;
};

export type MerchantBank = {
  id?: string;
  name: string;
  bankCode: string;
  cbnCode?: string | null;
  logoUrl?: string | null;
  categoryId?: string | null;
};

export type BusinessAccountLedgerEntry = {
  id: string;
  reference: string;
  status: string;
  type: "credit" | "debit";
  category: string;
  amount: number;
  fee?: number;
  counterpartyName?: string | null;
  counterpartyAccountNumber?: string | null;
  counterpartyBankName?: string | null;
  narration?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
};

export type RecentBusinessTransfer = {
  id: string;
  reference: string;
  name: string;
  accountNumber?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  amount?: number;
  createdAt?: string | null;
};

export type ValidatedTransferAccount = {
  accountName?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  sessionId?: string | null;
  nameEnquiryReference?: string | null;
};

export type CheckoutSession = {
  _id: string;
  reference: string;
  externalReference?: string | null;
  amount?: number | null;
  currency: string;
  description?: string | null;
  paymentType?: "one_time" | "multiple";
  linkExpires?: boolean;
  linkExpiresAt?: string | null;
  status: string;
  activatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  callbackUrl?: string | null;
  webhookUrl?: string | null;
  checkoutUrl?: string | null;
  businessName?: string | null;
  businessLogoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  settlementAccount?: {
    accountId?: string | null;
    alias?: string | null;
    kind?: "primary" | "checkout" | "custom" | string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    currency?: string | null;
    status?: string | null;
  } | null;
  virtualAccount?: {
    attemptReference?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    bankName?: string | null;
    providerReference?: string | null;
    amount?: number | null;
    status?: string | null;
    paidAt?: string | null;
    expiresAt?: string | null;
  } | null;
  attemptReference?: string | null;
};

export type CheckoutConfig = {
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  callbackUrl?: string | null;
  webhookUrl?: string | null;
};

export type MerchantFeeSchedule = {
  checkout: Array<{
    key: string;
    label: string;
    providerFeeType: "flat" | "percentage";
    providerFeeValue: number;
    providerFeeLabel: string;
    markupFee: number;
    totalFeeLabel: string;
  }>;
  transfer: Array<{
    key: string;
    label: string;
    providerFeeType: "flat" | "percentage";
    providerFeeValue: number;
    providerFeeLabel: string;
    markupFee: number;
    totalFeeLabel: string;
  }>;
  verification: Array<{
    key: string;
    label: string;
    providerFee: number;
    markupFee: number;
    totalFeeLabel: string;
  }>;
};

export type WebhookConfig = {
  url?: string | null;
  enabled?: boolean;
  events?: string[];
  secretPreview?: string | null;
  lastDeliveryAt?: string | null;
};

export type WebhookLog = {
  _id: string;
  event: string;
  targetUrl?: string | null;
  signature?: string | null;
  deliveryStatus: string;
  requestPayload?: Record<string, unknown> | null;
  responseStatus?: number | null;
  responseBody?: unknown;
  retryCount?: number | null;
  deliveredAt?: string | null;
  createdAt?: string | null;
  lastAttemptAt?: string | null;
};

export type AuditLog = {
  _id: string;
  action: string;
  actorType: string;
  actorLabel?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
};
