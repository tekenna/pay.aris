"use client";

import type { AuditLog, CheckoutConfig, WebhookConfig, WebhookLog } from "@/lib/types";
import { apiRequest, withQuery } from "@/services/api-client";

export const developersService = {
  getApiKeys(token: string) {
    return apiRequest<{ test: unknown; live: unknown }>("/businesses/api-keys", {
      token,
    });
  },
  generateApiKeys(token: string, environment: "test" | "live") {
    return apiRequest<{
      publicKey: string;
      secretKey: string;
      environment: string;
    }>("/businesses/api-keys/generate", {
      method: "POST",
      token,
      data: { environment },
    });
  },
  regenerateApiKey(token: string, environment: "test" | "live") {
    return apiRequest<{
      publicKey: string;
      secretKey: string;
      environment: string;
    }>(`/businesses/api-keys/${environment}/regenerate`, {
      method: "POST",
      token,
    });
  },
  revokeApiKey(token: string, environment: "test" | "live") {
    return apiRequest<null>(`/businesses/api-keys/${environment}/revoke`, {
      method: "POST",
      token,
    });
  },
  getWebhookConfig(token: string) {
    return apiRequest<WebhookConfig>("/businesses/webhooks", { token });
  },
  updateWebhookConfig(token: string, body: Record<string, unknown>) {
    return apiRequest<WebhookConfig>("/businesses/webhooks", {
      method: "PUT",
      token,
      data: body,
    });
  },
  getWebhookLogs(token: string, params: URLSearchParams) {
    return apiRequest<WebhookLog[]>(
      withQuery("/businesses/webhooks/logs", params),
      { token },
    );
  },
  retryWebhook(token: string, logId: string, reason?: string) {
    return apiRequest<WebhookLog>(`/businesses/webhooks/logs/${logId}/retry`, {
      method: "POST",
      token,
      data: { reason },
    });
  },
  getAuditLogs(token: string, params: URLSearchParams) {
    return apiRequest<AuditLog[]>(withQuery("/businesses/audit-logs", params), {
      token,
    });
  },
  getCheckoutConfig(token: string) {
    return apiRequest<CheckoutConfig>("/businesses/checkout-config", { token });
  },
};
