"use client";

import { useEffect, useState } from "react";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { MoreIcon, SearchIcon } from "@/components/ui/icons";
import { merchantApi } from "@/lib/merchant-api";
import type { ApiKeyEnvironment, AuditLog, WebhookConfig, WebhookLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type ApiKeysResponse = {
  live?: ApiKeyEnvironment;
  test?: ApiKeyEnvironment;
};

const keyFallbacks = {
  live: {
    publicKey: "PYY-PUB_live_a1b2c3d4e5f6g7h8i9j0",
    secretKeyPreview: "PYY-SEC_live_a1b2c3d4e5f6g7h8i9j0",
    encryptionKey: "PYY-ENC_live_a1b2c3d4e5f6g7h8i9j0",
  },
  test: {
    publicKey: "pyy_live_a1b2c3d4e5f6g7h8i9j0",
    secretKeyPreview: "pk_live_a1b2c3d4e5f6g7h8i9j0",
    encryptionKey: "pk_live_a1b2c3d4e5f6g7h8i9j0",
  },
};

export default function DevelopersPage() {
  const { session } = useBusinessSession();
  const [tab, setTab] = useState("api-keys");
  const [docsModal, setDocsModal] = useState<"guides" | "documentation" | null>(null);
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookLog | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeysResponse>({});
  const [webhook, setWebhook] = useState<WebhookConfig>({
    url: "",
    enabled: false,
    events: [],
  });
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logPages, setLogPages] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!session?.token) {
        return;
      }

      const [keysResponse, webhookResponse, webhookLogResponse, auditLogResponse] = await Promise.all([
        merchantApi.getApiKeys(session.token),
        merchantApi.getWebhookConfig(session.token),
        merchantApi.getWebhookLogs(
          session.token,
          new URLSearchParams({ page: String(logPage), limit: "25" }),
        ),
        merchantApi.getAuditLogs(session.token, new URLSearchParams({ page: "1", limit: "25" })),
      ]);

      if (keysResponse.statusCode === 200) {
        setApiKeys(keysResponse.data as ApiKeysResponse);
      }

      if (webhookResponse.statusCode === 200) {
        setWebhook(webhookResponse.data);
      }

      if (webhookLogResponse.statusCode === 200) {
        setWebhookLogs(webhookLogResponse.data);
        setLogPages(webhookLogResponse.pagination?.pages || 1);
      }

      if (auditLogResponse.statusCode === 200) {
        setAuditLogs(auditLogResponse.data);
      }
    }

    void loadData();
  }, [logPage, session?.token]);

  async function handleGenerate(environment: "test" | "live") {
    if (!session?.token) {
      return;
    }

    const response = apiKeys[environment]?.publicKey
      ? await merchantApi.regenerateApiKey(session.token, environment)
      : await merchantApi.generateApiKeys(session.token, environment);

    setMessage(response.message);
    if (response.statusCode === 200) {
      const keysResponse = await merchantApi.getApiKeys(session.token);
      if (keysResponse.statusCode === 200) {
        setApiKeys(keysResponse.data as ApiKeysResponse);
      }
    }
  }

  return (
    <MerchantShell title="Developers">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { label: "API Keys", value: "api-keys" },
          { label: "Webhooks", value: "webhooks" },
          { label: "API Documentation", value: "docs" },
          { label: "Logs", value: "logs" },
        ]}
      />

      {message ? <p className="mb-5 rounded-[10px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</p> : null}

      {tab === "api-keys" ? (
        <Card className="p-6">
          <ApiKeySection title="Live API Keys" env="live" keys={apiKeys.live} onRegenerate={() => handleGenerate("live")} />
          <ApiKeySection title="Test API Keys" env="test" keys={apiKeys.test} onRegenerate={() => handleGenerate("test")} />
          <div className="mt-12 flex justify-end">
            <Button className="dashboard-black-button h-[54px] rounded-[10px] px-9 text-[16px] font-bold" onClick={() => handleGenerate("live")}>Regenerate Keys</Button>
          </div>
        </Card>
      ) : null}

      {tab === "webhooks" ? (
        <Card className="overflow-hidden p-7">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[15px] font-medium text-[#667085]">Showing {webhookLogs.length || 1}</p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative hidden w-[248px] md:block">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  placeholder="Search by Session ID..."
                  className="h-[48px] w-full rounded-[10px] border border-transparent bg-[#f2f4f7] pl-12 pr-4 text-sm font-medium outline-none placeholder:text-[#98a2b3]"
                />
              </div>
              <Button className="dashboard-black-button h-[48px] rounded-[10px] px-9 text-[16px] font-bold" onClick={() => setTab("docs")}>
                View Docs
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                <tr>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Webhook URL</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(webhookLogs.length ? webhookLogs : buildWebhookFallback(webhook)).map((log) => (
                  <tr
                    key={log._id}
                    className="cursor-pointer text-[15px] font-medium text-[#667085] hover:bg-slate-50"
                    onClick={() => setSelectedWebhookLog(log)}
                  >
                    <td className="px-4 py-7">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-7">
                      <p className="font-bold text-[#202939]">POST</p>
                      <p className="mt-1">{log.targetUrl || webhook.url || "https://tekenna.requestcatcher.com"}</p>
                    </td>
                    <td className="px-4 py-7">
                      <StatusBadge value={log.deliveryStatus || "200 Completed"} />
                    </td>
                    <td className="px-4 py-7 text-right text-[#667085]">
                      <MoreIcon className="ml-auto h-5 w-5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={logPage}
            limit={25}
            totalPages={logPages}
            onPageChange={setLogPage}
            onLimitChange={() => undefined}
          />
        </Card>
      ) : null}

      {tab === "docs" ? (
        <Card className="p-6">
          <p className="text-lg font-semibold text-slate-950">API Documentation</p>
          <p className="mt-2 text-sm text-slate-500">
            Integrate Aris into your application with the hosted one-time checkout API and business-management APIs.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Guides", "Learn how the one-time hosted checkout activates, generates its virtual account, verifies payment, and reports status."],
              ["Documentation", "Reference for x-client checkout creation, payment verification, callbacks, and webhook integration for one-time checkout."],
            ].map(([title, description]) => (
              <button
                key={title}
                type="button"
                onClick={() => setDocsModal(title.toLowerCase() as "guides" | "documentation")}
                className="rounded-[12px] bg-slate-50 p-6 transition hover:bg-emerald-50"
              >
                <p className="text-lg font-semibold text-slate-900">{title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
                <p className="mt-6 text-sm font-semibold text-[var(--brand)]">Learn more</p>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "logs" ? (
        <Card className="overflow-hidden p-7">
          <div className="mb-8">
            <p className="text-[18px] font-bold text-slate-950">Audit Logs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                <tr>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Action</th>
                  <th className="px-4 py-4">Actor</th>
                  <th className="px-4 py-4">Entity</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100">
                    <td className="px-4 py-6">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-6 font-medium text-slate-800">{log.action}</td>
                    <td className="px-4 py-6">{log.actorLabel || log.actorType}</td>
                    <td className="px-4 py-6">{log.entityType || "--"}</td>
                  </tr>
                ))}
                {!auditLogs.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-sm text-slate-400">
                      No audit logs yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination
            page={logPage}
            limit={25}
            totalPages={logPages}
            onPageChange={setLogPage}
            onLimitChange={() => undefined}
          />
        </Card>
      ) : null}

      <Modal
        open={docsModal === "guides"}
        onClose={() => setDocsModal(null)}
        title="Development Guides"
        description="Use these guides to understand how the developer checkout flow works for one-time hosted payments and how status is reported back to your application."
      >
        <div className="grid gap-4 text-sm leading-7 text-slate-600">
          <div className="rounded-[16px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">1. Developer checkout is for one-time collections</p>
            <p className="mt-2">
              The developer integration creates a hosted one-time checkout session. Reusable payment
              links, QR management, and multiple-use collections remain features of the main Aris Pay
              application dashboard.
            </p>
          </div>
          <div className="rounded-[16px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">2. Checkout activates on first visit</p>
            <p className="mt-2">
              A newly created checkout session stays inactive until a customer visits the hosted
              checkout URL. The first checkout fetch activates the session before payment starts.
            </p>
          </div>
          <div className="rounded-[16px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">3. Virtual accounts last for 20 minutes</p>
            <p className="mt-2">
              Once the hosted checkout initializes, it generates a dedicated virtual account for the
              payment. That account is valid for 20 minutes, and the one-time checkout expires with it.
            </p>
          </div>
          <div className="rounded-[16px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">4. Use callbacks and webhooks for updates</p>
            <p className="mt-2">
              Provide a callback URL to redirect the customer after a successful payment and a webhook
              URL to receive server-to-server transaction updates with the final payment details.
            </p>
          </div>
          <div className="rounded-[16px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">5. Verify and reconcile</p>
            <p className="mt-2">
              Use the payment verification endpoint to confirm the final payment state. Successful
              payments trigger transaction creation and webhook delivery.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={docsModal === "documentation"}
        onClose={() => setDocsModal(null)}
        title="API Documentation"
        description="Use the server-side x-client header with your secret key to create one-time hosted checkout sessions, verify payments, and receive webhook updates."
        maxWidthClassName="max-w-[1100px]"
      >
        <div className="grid gap-6">
          <section className="rounded-[18px] bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Create One-Time Checkout</p>
            <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100"><code>{`curl -X POST "${process.env.NEXT_PUBLIC_API_BASE_URL || "https://aris-api-ftgj.onrender.com/api"}/checkout/create" \\
  -H "Content-Type: application/json" \\
  -H "x-client: YOUR_SECRET_KEY" \\
  -d '{
    "amount": 25000,
    "paymentType": "one_time",
    "description": "April subscription",
    "externalReference": "INV-APR-204",
    "callbackUrl": "https://merchant.example.com/payments/callback",
    "webhookUrl": "https://merchant.example.com/webhooks/aris",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'`}</code></pre>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This integration is for one-time hosted checkout only. Reusable payment links and
              other payment-link controls are managed inside the main Aris Pay application.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[18px] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Node.js Example</p>
              <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100"><code>{`const response = await fetch("${process.env.NEXT_PUBLIC_API_BASE_URL || "https://aris-api-ftgj.onrender.com/api"}/checkout/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-client": process.env.ARIS_SECRET_KEY
  },
  body: JSON.stringify({
    amount: 25000,
    paymentType: "one_time",
    description: "Membership payment",
    externalReference: "MEM-1002",
    callbackUrl: "https://merchant.example.com/return",
    webhookUrl: "https://merchant.example.com/webhooks/aris"
  })
});

const payload = await response.json();
console.log(payload.data.checkout_url);`}</code></pre>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Verify Payment</p>
              <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100"><code>{`curl "${process.env.NEXT_PUBLIC_API_BASE_URL || "https://aris-api-ftgj.onrender.com/api"}/payments/verify/ARIS_CHK_REFERENCE"`}</code></pre>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The verification response includes the payment status, amount, currency, paid time,
                callback information, and the virtual account details used for collection.
              </p>
            </div>
          </section>

          <section className="rounded-[18px] bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Webhook Payload</p>
            <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100"><code>{`{
  "event": "payment.success",
  "reference": "ARIS_CHK_REFERENCE",
  "externalReference": "INV-APR-204",
  "status": "success",
  "amount": 25000,
  "currency": "NGN",
  "businessId": "BUSINESS_ID",
  "businessName": "Merchant Business",
  "checkoutUrl": "https://checkout.ariswallex.com/ARIS_CHK_REFERENCE",
  "callbackUrl": "https://merchant.example.com/payments/callback",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "virtualAccount": {
    "accountNumber": "1234567890",
    "accountName": "Merchant Business",
    "bankName": "Safehaven MFB"
  },
  "paidAt": "2026-04-24T12:00:00.000Z",
  "note": "Status updated from Safehaven webhook."
}`}</code></pre>
          </section>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedWebhookLog)}
        onClose={() => setSelectedWebhookLog(null)}
        title="Webhook Delivery"
        description="Full details of the webhook request delivered to your configured webhook URL."
        maxWidthClassName="max-w-[1100px]"
      >
        {selectedWebhookLog ? (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Event", selectedWebhookLog.event || "--"],
                ["Target URL", selectedWebhookLog.targetUrl || webhook.url || "--"],
                ["Delivery Status", selectedWebhookLog.deliveryStatus || "--"],
                ["Response Status", selectedWebhookLog.responseStatus ? String(selectedWebhookLog.responseStatus) : "--"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-[18px] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">cURL Request</p>
              <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100">
                <code>{buildWebhookCurl(selectedWebhookLog)}</code>
              </pre>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[18px] bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Request Payload</p>
                <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100">
                  <code>{JSON.stringify(selectedWebhookLog.requestPayload ?? {}, null, 2)}</code>
                </pre>
              </section>
              <section className="rounded-[18px] bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Response Body</p>
                <pre className="mt-4 overflow-x-auto rounded-[16px] bg-slate-950 p-5 text-sm text-slate-100">
                  <code>{JSON.stringify(selectedWebhookLog.responseBody ?? {}, null, 2)}</code>
                </pre>
              </section>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Created", formatDateTime(selectedWebhookLog.createdAt)],
                ["Last Attempt", formatDateTime(selectedWebhookLog.lastAttemptAt)],
                ["Delivered", formatDateTime(selectedWebhookLog.deliveredAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{value || "--"}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </MerchantShell>
  );
}

function ApiKeySection({
  title,
  env,
  keys,
}: {
  title: string;
  env: "live" | "test";
  keys?: ApiKeyEnvironment;
  onRegenerate: () => void;
}) {
  const fallback = keyFallbacks[env];
  const rows = [
    ["Public Key", "Use this for client-side integration", keys?.publicKey || fallback.publicKey],
    ["Secret Key", "Use this for server-side integration", keys?.secretKeyPreview || fallback.secretKeyPreview],
    ["Encryption Key", "Use this for server-side integration", fallback.encryptionKey],
  ];

  return (
    <section className="mb-8 last:mb-0">
      <p className="mb-5 text-[15px] font-bold text-[#202939]">{title}</p>
      <div className="rounded-[18px] bg-[#f1f3f6] px-5 py-6">
        <div className="grid gap-5">
          {rows.map(([label, hint, value]) => (
            <div key={label} className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_290px]">
              <div>
                <p className="text-[13px] font-bold text-[#202939]">{label}</p>
                <p className="mt-2 text-[13px] font-medium text-[#667085]">{hint}</p>
              </div>
              <div className="rounded-[6px] bg-white px-4 py-3 text-[14px] font-semibold text-[#202939]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildWebhookFallback(webhook: WebhookConfig): WebhookLog[] {
  const dates = [
    "2025-02-12T14:15:00.000Z",
    "2025-02-12T13:00:00.000Z",
    "2025-02-12T08:30:00.000Z",
    "2025-02-11T22:45:00.000Z",
    "2025-02-11T19:15:00.000Z",
    "2025-02-10T18:45:00.000Z",
    "2025-02-09T16:13:00.000Z",
    "2025-02-07T14:10:00.000Z",
    "2025-02-02T15:15:00.000Z",
  ];

  return dates.map((createdAt, index) => ({
    _id: `fallback-${index}`,
    event: "payment.success",
    targetUrl: webhook.url || "https://tekenna.requestcatcher.com",
    signature: "demo_signature",
    deliveryStatus: "200 Completed",
    requestPayload: {
      event: "payment.success",
      reference: "ARIS_CHK_REFERENCE",
      amount: 25000,
      currency: "NGN",
    },
    responseStatus: 200,
    responseBody: { ok: true },
    createdAt,
    lastAttemptAt: createdAt,
    deliveredAt: createdAt,
  }));
}

function buildWebhookCurl(log: WebhookLog) {
  const headers = [
    `curl -X POST "${log.targetUrl || ""}"`,
    `  -H "Content-Type: application/json"`,
  ];

  if (log.signature) {
    headers.push(`  -H "x-aris-signature: ${log.signature}"`);
  }

  headers.push(`  -d '${JSON.stringify(log.requestPayload ?? {}, null, 2)}'`);
  return headers.join(" \\\n");
}
