"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import {
  MoreIcon,
  ScanIcon,
  UserSquareIcon,
  XIcon,
} from "@/components/ui/icons";
import type { Business, BusinessTeamMember, CheckoutConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { settingsService } from "@/services/settings.service";

type SettingsTab = "profile" | "compliance" | "checkout" | "security" | "team";
type SettingsDrawer = "invite" | "upload" | null;

const OWNER_ADMIN_ROLES = new Set(["owner", "admin"]);

export default function SettingsPage() {
  const { session, setSession } = useBusinessSession();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [drawer, setDrawer] = useState<SettingsDrawer>(null);
  const [profile, setProfile] = useState<Business | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutConfig>({
    primaryColor: "#0F172A",
    secondaryColor: "#16A34A",
  });
  const [teamMembers, setTeamMembers] = useState<BusinessTeamMember[]>([]);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isSavingCheckout, setIsSavingCheckout] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");

    if (requestedTab === "compliance" || requestedTab === "security") {
      setTab(requestedTab);
    }

    function openCompliance() {
      setTab("compliance");
    }

    window.addEventListener("aris-pay:open-compliance", openCompliance);
    return () =>
      window.removeEventListener("aris-pay:open-compliance", openCompliance);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!session?.token) {
        return;
      }

      const [profileResponse, checkoutResponse] = await Promise.all([
        settingsService.getProfile(session.token),
        settingsService.getCheckoutConfig(session.token),
      ]);

      if (profileResponse.statusCode === 200) {
        setProfile(profileResponse.data);
      }

      if (checkoutResponse.statusCode === 200) {
        setCheckout(checkoutResponse.data);
      }

      if (OWNER_ADMIN_ROLES.has(session.business.currentRole || "owner")) {
        const teamResponse = await settingsService.getTeamMembers(
          session.token,
        );
        if (teamResponse.statusCode === 200) {
          setTeamMembers(teamResponse.data);
        }
      }
    }

    void loadData();
  }, [session?.token]);

  const currentRole = (
    profile?.currentRole ||
    session?.business.currentRole ||
    "owner"
  ).toLowerCase();
  const canViewSecurity = OWNER_ADMIN_ROLES.has(currentRole);
  const canManageTeam = OWNER_ADMIN_ROLES.has(currentRole);
  const tabItems = [
    { label: "Profile", value: "profile" },
    { label: "Compliance", value: "compliance" },
    { label: "Checkout Preferences", value: "checkout" },
    ...(canViewSecurity ? [{ label: "Security", value: "security" }] : []),
    ...(canManageTeam ? [{ label: "Team", value: "team" }] : []),
  ];

  return (
    <MerchantShell title="Settings">
      <Tabs
        value={tab}
        onChange={(nextTab) => setTab(nextTab as SettingsTab)}
        items={tabItems}
      />

      {tab === "profile" ? (
        <ProfilePanel
          profile={profile || session?.business || null}
          loading={isSavingProfile}
          onUpload={() => setDrawer("upload")}
          onSave={async (payload) => {
            if (!session?.token) {
              return;
            }

            setIsSavingProfile(true);
            try {
              const response = await settingsService.updateProfile(
                session.token,
                payload,
              );
              if (response.statusCode !== 200) {
                toast.error(response.message || "Unable to update profile.");
                return;
              }

              setProfile(response.data);
              setSession({
                token: session.token,
                refreshToken: session.refreshToken,
                business: response.data,
              });
              toast.success(
                response.message || "Profile updated successfully.",
              );
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Unable to update profile.",
              );
            } finally {
              setIsSavingProfile(false);
            }
          }}
        />
      ) : null}

      {tab === "compliance" ? (
        <CompliancePanel
          profile={profile || session?.business || null}
          token={session?.token}
          onApproved={(business) => {
            setProfile(business);
            if (session?.token) {
              setSession({ token: session.token, business });
            }
          }}
        />
      ) : null}

      {tab === "checkout" ? (
        <CheckoutPanel
          checkout={checkout}
          isSaving={isSavingCheckout}
          onChange={setCheckout}
          onSave={async () => {
            if (!session?.token) {
              return;
            }

            setIsSavingCheckout(true);
            try {
              const response = await settingsService.updateCheckoutConfig(
                session.token,
                {
                  ...checkout,
                },
              );

              if (response.statusCode === 200) {
                setCheckout(response.data);
                setProfile((current) =>
                  current
                    ? {
                        ...current,
                        checkoutConfig: response.data,
                      }
                    : current,
                );
                if (session?.token) {
                  setSession({
                    token: session.token,
                    business: {
                      ...(profile || session.business),
                      checkoutConfig: response.data,
                    },
                  });
                }
              }
            } finally {
              setIsSavingCheckout(false);
            }
          }}
        />
      ) : null}

      {tab === "security" && canViewSecurity ? (
        <SecurityPanel
          profile={profile || session?.business || null}
          token={session?.token}
          onPinUpdated={(hasPaymentPin) => {
            setProfile((current) =>
              current
                ? {
                    ...current,
                    hasPaymentPin,
                  }
                : current,
            );

            if (session?.token) {
              setSession({
                token: session.token,
                business: {
                  ...(profile || session.business),
                  hasPaymentPin,
                },
              });
            }
          }}
        />
      ) : null}
      {tab === "team" && canManageTeam ? (
        <TeamPanel members={teamMembers} onInvite={() => setDrawer("invite")} />
      ) : null}

      <InviteMemberDrawer
        open={drawer === "invite"}
        onClose={() => setDrawer(null)}
        loading={isInvitingMember}
        onInvite={async (payload) => {
          if (!session?.token) {
            return;
          }

          setIsInvitingMember(true);
          try {
            const response = await settingsService.inviteTeamMember(
              session.token,
              payload,
            );
            if (response.statusCode !== 200) {
              toast.error(response.message || "Unable to invite team member.");
              return;
            }

            setTeamMembers((current) => {
              const existingIndex = current.findIndex(
                (member) => member._id === response.data._id,
              );
              if (existingIndex >= 0) {
                const next = [...current];
                next[existingIndex] = response.data;
                return next;
              }

              return [...current, response.data];
            });
            toast.success(response.message || "Invitation sent successfully.");
            setDrawer(null);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to invite team member.",
            );
          } finally {
            setIsInvitingMember(false);
          }
        }}
      />
      <UploadImageDrawer
        open={drawer === "upload"}
        onClose={() => setDrawer(null)}
      />
    </MerchantShell>
  );
}

function ProfilePanel({
  profile,
  loading,
  onUpload,
  onSave,
}: {
  profile: Business | null;
  loading: boolean;
  onUpload: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    emailAddress: profile?.emailAddress || "",
    phoneNumber: profile?.phoneNumber || "",
    street: profile?.address?.street || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    country: profile?.address?.country || "",
    postalCode: profile?.address?.postalCode || "",
  });

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      emailAddress: profile?.emailAddress || "",
      phoneNumber: profile?.phoneNumber || "",
      street: profile?.address?.street || "",
      city: profile?.address?.city || "",
      state: profile?.address?.state || "",
      country: profile?.address?.country || "",
      postalCode: profile?.address?.postalCode || "",
    });
  }, [
    profile?.address?.city,
    profile?.address?.country,
    profile?.address?.postalCode,
    profile?.address?.state,
    profile?.address?.street,
    profile?.businessName,
    profile?.emailAddress,
    profile?.phoneNumber,
  ]);

  const profileTag = `ARIS-${String(profile?._id || "MERCHANT")
    .slice(-10)
    .toUpperCase()}`;

  return (
    <Card className="dashboard-surface-card overflow-hidden p-8">
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative h-[118px] w-[118px] rounded-full bg-[radial-gradient(circle_at_50%_24%,#f7d7bd_0_17%,#111827_18%_28%,#d8f0f5_29%_57%,#e7f5fa_58%_100%)] shadow-sm" />
        <button
          type="button"
          onClick={onUpload}
          className="absolute ml-[82px] mt-[82px] inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[var(--brand)] text-white shadow-sm"
          aria-label="Upload business image"
        >
          <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-current" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#64748b]">Aris Tag</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-[18px] font-semibold text-[#1f2937]">
              {profileTag}
            </p>
            <StatusBadge value={profile?.status || "pending"} />
          </div>
          <p className="mt-3 max-w-[640px] text-sm text-[#667085]">
            Keep your business details current so compliance checks, payment
            receipts, and merchant account records stay accurate.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section className="rounded-[8px] border border-[var(--border)] bg-white p-6">
          <div className="mb-6">
            <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Account Settings
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              Update the business identity and contact details used across Aris
              Pay.
            </p>
          </div>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSave({
                businessName: form.businessName,
                phoneNumber: form.phoneNumber,
                address: {
                  street: form.street,
                  city: form.city,
                  state: form.state,
                  country: form.country,
                  postalCode: form.postalCode,
                },
              });
            }}
          >
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  businessName: event.target.value,
                }))
              }
              disabled
              fieldClassName="border-[#d8e2ec] bg-white"
            />
            <Input
              label="Business Email"
              value={form.emailAddress}
              disabled
              fieldClassName="border-[#d8e2ec] bg-[#f8fafc]"
            />
            <Input
              label="Business Address"
              value={form.street}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  street: event.target.value,
                }))
              }
              fieldClassName="border-[#d8e2ec] bg-white"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="City"
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                fieldClassName="border-[#d8e2ec] bg-white"
              />
              <Input
                label="State"
                value={form.state}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    state: event.target.value,
                  }))
                }
                fieldClassName="border-[#d8e2ec] bg-white"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Country"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    country: event.target.value,
                  }))
                }
                fieldClassName="border-[#d8e2ec] bg-white"
              />
              <Input
                label="Postal Code"
                value={form.postalCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    postalCode: event.target.value,
                  }))
                }
                fieldClassName="border-[#d8e2ec] bg-white"
              />
            </div>
            <Input
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phoneNumber: event.target.value,
                }))
              }
              fieldClassName="border-[#d8e2ec] bg-white"
            />
            <div className="pt-4">
              <Button type="submit" loading={loading} className="min-w-[146px]">
                Save
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-6">
          <div className="mb-6">
            <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Business Overview
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              A quick snapshot of your merchant account configuration and
              verification state.
            </p>
          </div>
          <div className="grid gap-4">
            <DetailsRow
              label="Current Role"
              value={profile?.currentRole || "owner"}
            />
            <DetailsRow
              label="Tier Level"
              value={`Tier ${profile?.businessTierLevel || 1}`}
            />
            <DetailsRow
              label="Primary Settlement"
              value={profile?.safehaven?.accountNumber || "--"}
            />
            <DetailsRow
              label="Checkout Account"
              value={profile?.safehavenCheckout?.accountNumber || "--"}
            />
            <DetailsRow
              label="Identity Type"
              value={profile?.kyc?.identityType || "--"}
            />
            <DetailsRow
              label="Compliance Status"
              value={profile?.kyc?.status || profile?.status || "--"}
            />
          </div>
        </section>
      </div>
    </Card>
  );
}

function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-[62px] items-center gap-2 rounded-[8px] border border-[var(--border)] bg-white px-4 py-3 text-[14px] md:grid-cols-[200px_minmax(0,1fr)]">
      <p className="font-medium text-[#98a2b3]">{label}</p>
      <p className="font-semibold capitalize text-[#344054]">{value}</p>
    </div>
  );
}

function formatNairaLimit(value?: number | null) {
  const amount = Number(value ?? 0);
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

function CompliancePanel({
  profile,
  token,
  onApproved,
}: {
  profile: Business | null;
  token?: string;
  onApproved: (business: Business) => void;
}) {
  const businessTierLevel = Number(profile?.businessTierLevel || 1);
  const [identityType, setIdentityType] = useState(
    profile?.kyc?.identityType || "BVN",
  );
  const [identityNumber, setIdentityNumber] = useState(
    profile?.kyc?.identityNumber || "",
  );
  const [identityId, setIdentityId] = useState(profile?.kyc?.identityId || "");
  const [otp, setOtp] = useState("");
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<
    "identity" | "otp" | "save" | null
  >(null);

  useEffect(() => {
    setIdentityType(profile?.kyc?.identityType || "BVN");
    setIdentityNumber(profile?.kyc?.identityNumber || "");
    setIdentityId(profile?.kyc?.identityId || "");
  }, [
    profile?.businessTierLevel,
    profile?.kyc?.identityId,
    profile?.kyc?.identityNumber,
    profile?.kyc?.identityType,
  ]);

  useEffect(() => {
    if (!cacFile || !cacFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(cacFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cacFile]);

  if (businessTierLevel >= 3) {
    return (
      <Card className="dashboard-surface-card p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[8px] border border-[var(--border)] bg-white p-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              <UserSquareIcon className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Tier 3 active
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#667085]">
              Your BVN and CAC details are complete, your business is on Tier 3,
              and you can process up to{" "}
              {formatNairaLimit(
                profile?.tierLimits?.perTransactionLimit ?? 5000000,
              )}{" "}
              per transaction.
            </p>
            <div className="mt-8 grid gap-4">
              <DetailsRow label="Tier" value="Tier 3" />
              <DetailsRow
                label="Account Name"
                value={profile?.safehaven?.accountName || "--"}
              />
              <DetailsRow
                label="Account Number"
                value={profile?.safehaven?.accountNumber || "--"}
              />
              <DetailsRow
                label="Checkout Account"
                value={profile?.safehavenCheckout?.accountNumber || "--"}
              />
            </div>
          </section>
          <section className="rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-6">
            <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Compliance Summary
            </p>
            <div className="mt-6 grid gap-4">
              <DetailsRow
                label="Identity Type"
                value={profile?.kyc?.identityType || "--"}
              />
              <DetailsRow
                label="Identity Number"
                value={profile?.kyc?.identityNumber || "--"}
              />
              <DetailsRow
                label="KYC Status"
                value={profile?.kyc?.status || "approved"}
              />
              <DetailsRow
                label="Per Transaction Limit"
                value={formatNairaLimit(
                  profile?.tierLimits?.perTransactionLimit ?? 5000000,
                )}
              />
            </div>
          </section>
        </div>
      </Card>
    );
  }

  if (businessTierLevel >= 2) {
    return (
      <Card className="dashboard-surface-card p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[8px] border border-[var(--border)] bg-white p-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              <UserSquareIcon className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Tier 2 active
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#667085]">
              Your identity has been verified and your business has been
              upgraded to Tier 2. You can now process up to{" "}
              {formatNairaLimit(
                profile?.tierLimits?.perTransactionLimit ?? 10000,
              )}{" "}
              per transaction. Upload your CAC document to move to Tier 3 and
              unlock up to NGN 5,000,000 per transaction.
            </p>
            <div className="mt-8 grid gap-4">
              <DetailsRow label="Tier" value="Tier 2" />
              <DetailsRow
                label="Account Name"
                value={profile?.safehaven?.accountName || "--"}
              />
              <DetailsRow
                label="Account Number"
                value={profile?.safehaven?.accountNumber || "--"}
              />
              <DetailsRow
                label="Bank"
                value={profile?.safehaven?.bankName || "Safehaven MFB"}
              />
            </div>
          </section>

          <section className="rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-6">
            <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Tier 3 Upgrade
            </p>
            <p className="mt-2 text-sm text-[#667085]">
              Upload your CAC document to complete business verification and
              unlock higher transaction limits.
            </p>
            <form
              className="mt-6 grid gap-6"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!token || !cacFile || !identityId) {
                  toast.error("Upload your CAC document to continue.");
                  return;
                }

                setLoadingStep("save");
                try {
                  const response = await settingsService.submitCorporateKyc(
                    token,
                    {
                      identityType,
                      identityNumber,
                      identityId,
                      cac: cacFile,
                    },
                  );

                  if (response.statusCode !== 200) {
                    toast.error(
                      response.message || "Unable to upload CAC document.",
                    );
                    return;
                  }

                  onApproved(response.data);
                  setCacFile(null);
                  toast.success(
                    response.message || "Tier 3 unlocked successfully.",
                  );
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to upload CAC document.",
                  );
                } finally {
                  setLoadingStep(null);
                }
              }}
            >
              <div className="rounded-[8px] border border-dashed border-[#b7dfc9] bg-[#f8fffb] p-5">
                <p className="text-[14px] font-semibold text-[#101828]">
                  Upload CAC document for Tier 3
                </p>
                <label className="mt-4 flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[8px] bg-white px-4 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(event) =>
                      setCacFile(event.target.files?.[0] || null)
                    }
                  />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="CAC preview"
                      className="max-h-[108px] rounded-[8px] object-contain"
                    />
                  ) : (
                    <>
                      <UserSquareIcon className="h-8 w-8 text-[var(--brand)]" />
                      <span className="mt-3 text-[14px] font-semibold text-[#344054]">
                        {cacFile?.name || "Click to upload CAC document"}
                      </span>
                      <span className="mt-1 text-[12px] text-[#98a2b3]">
                        PDF, PNG, or JPG accepted
                      </span>
                    </>
                  )}
                </label>
              </div>

              <Button
                type="submit"
                loading={loadingStep === "save"}
                disabled={!cacFile}
                className="min-w-[180px]"
              >
                Upgrade To Tier 3
              </Button>
            </form>
          </section>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-surface-card p-8">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[8px] border border-[var(--border)] bg-white p-6">
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
            Compliance Settings
          </p>
          <p className="mt-3 text-[14px] leading-6 text-[#667085]">
            Every new business starts on Tier 1. Verify your BVN to move to Tier
            2 and unlock transactions up to NGN 10,000 per payment. After that,
            upload your CAC document to move to Tier 3 and unlock up to NGN
            5,000,000.
          </p>
          {profile?.kyc?.status === "rejected" ? (
            <div className="mt-5 rounded-[12px] border border-[#ffd6d6] bg-[#fff5f5] p-4 text-[13px] font-medium text-[#d33a44]">
              {profile?.kyc?.rejectionReason ||
                "Your previous submission was rejected. Please review and submit again."}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[14px] font-semibold text-[#202433]">
                  Identity Type
                </span>
                <span className="flex h-11 items-center rounded-[8px] border border-[#d8e2ec] bg-white px-4">
                  <select
                    value={identityType}
                    onChange={(event) => {
                      setIdentityType(event.target.value);
                      setIdentityId("");
                    }}
                    className="h-full w-full bg-transparent text-[14px] font-medium text-[#344054] outline-none"
                  >
                    <option value="BVN">BVN</option>
                    <option value="NIN">NIN</option>
                    <option value="BVNUSSD">BVN USSD</option>
                    <option value="vBVN">Virtual BVN</option>
                    <option value="vNIN">Virtual NIN</option>
                  </select>
                </span>
              </label>
              <Input
                label="Identity Number"
                value={identityNumber}
                onChange={(event) => {
                  setIdentityNumber(event.target.value);
                  setIdentityId("");
                }}
                placeholder="Enter identity number"
                fieldClassName="border-[#d8e2ec] bg-white"
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <Button
                type="button"
                loading={loadingStep === "identity"}
                disabled={!identityType || !identityNumber}
                className="min-w-[180px]"
                onClick={async () => {
                  if (!token) return;
                  setLoadingStep("identity");
                  try {
                    const response =
                      await settingsService.initiateBusinessIdentity(token, {
                        identityType,
                        identityNumber,
                      });

                    if (
                      response.statusCode !== 200 ||
                      !response.data?.identityId
                    ) {
                      toast.error(
                        response.message ||
                          "Unable to initiate identity verification.",
                      );
                      return;
                    }

                    setIdentityId(response.data.identityId);
                    toast.success("OTP sent for identity verification.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Unable to initiate identity verification.",
                    );
                  } finally {
                    setLoadingStep(null);
                  }
                }}
              >
                Verify Identity
              </Button>
              {identityId ? (
                <Input
                  label="OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  containerClassName="w-[180px]"
                  fieldClassName="border-[#d8e2ec] bg-white"
                />
              ) : null}
              {identityId ? (
                <Button
                  type="button"
                  loading={loadingStep === "otp"}
                  disabled={!otp}
                  variant="secondary"
                  className="min-w-[160px]"
                  onClick={async () => {
                    if (!token) return;
                    setLoadingStep("otp");
                    try {
                      const response =
                        await settingsService.validateBusinessIdentity(token, {
                          identityType,
                          identityId,
                          otp,
                        });

                      if (response.statusCode !== 200) {
                        toast.error(
                          response.message || "Unable to verify OTP.",
                        );
                        return;
                      }

                      onApproved(response.data.business);
                      toast.success(
                        "Identity verified. Your business is now on Tier 2.",
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to verify OTP.",
                      );
                    } finally {
                      setLoadingStep(null);
                    }
                  }}
                >
                  Confirm OTP
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-6">
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
            Tier Roadmap
          </p>
          <div className="mt-6 grid gap-4">
            <DetailsRow
              label="Current Tier"
              value={`Tier ${businessTierLevel}`}
            />
            <DetailsRow label="Tier 2 Limit" value={formatNairaLimit(10000)} />
            <DetailsRow
              label="Tier 3 Limit"
              value={formatNairaLimit(5000000)}
            />
            <DetailsRow
              label="Next Step"
              value={identityId ? "Confirm OTP" : "Verify identity"}
            />
          </div>
        </section>
      </div>
    </Card>
  );
}

function CheckoutPanel({
  checkout,
  isSaving,
  onChange,
  onSave,
}: {
  checkout: CheckoutConfig;
  isSaving: boolean;
  onChange: React.Dispatch<React.SetStateAction<CheckoutConfig>>;
  onSave: () => Promise<void>;
}) {
  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white p-8">
      <div className="max-w-4xl">
        <p className="text-[18px] font-semibold text-[#111827]">
          Checkout Preferences
        </p>
        <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#667085]">
          Control the branding and developer checkout defaults customers see
          while making payments.
        </p>

        <form
          className="mt-8 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <Input
            label="Logo URL"
            value={checkout.logoUrl || ""}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                logoUrl: event.target.value,
              }))
            }
            fieldClassName="border-transparent bg-[#f3f5f8]"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Primary Color"
              value={checkout.primaryColor || ""}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  primaryColor: event.target.value,
                }))
              }
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
            <Input
              label="Secondary Color"
              value={checkout.secondaryColor || ""}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  secondaryColor: event.target.value,
                }))
              }
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Callback URL"
              value={checkout.callbackUrl || ""}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  callbackUrl: event.target.value,
                }))
              }
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
            <Input
              label="Webhook URL"
              value={checkout.webhookUrl || ""}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  webhookUrl: event.target.value,
                }))
              }
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
          </div>
          <Button
            type="submit"
            loading={isSaving}
            className="dashboard-black-button mt-2 w-[168px]"
          >
            Save
          </Button>
        </form>
      </div>
    </Card>
  );
}

function SecurityPanel({
  profile,
  token,
  onPinUpdated,
}: {
  profile: Business | null;
  token?: string;
  onPinUpdated: (hasPaymentPin: boolean) => void;
}) {
  const hasPaymentPin = Boolean(profile?.hasPaymentPin);
  const [modalStep, setModalStep] = useState<
    "closed" | "password" | "pin" | "success"
  >("closed");
  const [intent, setIntent] = useState<"create" | "change">(
    hasPaymentPin ? "change" : "create",
  );
  const [loading, setLoading] = useState<"password" | "pin" | null>(null);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function resetFlow() {
    setModalStep("closed");
    setLoading(null);
    setPassword("");
    setPin("");
    setConfirmPin("");
    setOldPin("");
    setNewPin("");
    setConfirmNewPin("");
    setSuccessMessage("");
  }

  function openFlow(nextIntent: "create" | "change") {
    setIntent(nextIntent);
    setPassword("");
    setPin("");
    setConfirmPin("");
    setOldPin("");
    setNewPin("");
    setConfirmNewPin("");
    setSuccessMessage("");
    setModalStep("password");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("open") === "create-pin") {
      setIntent("create");
      setPassword("");
      setPin("");
      setConfirmPin("");
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      setSuccessMessage("");
      setModalStep("password");
      window.history.replaceState({}, "", "/dashboard/settings?tab=security");
    }

    function openCreatePinFlow() {
      setIntent("create");
      setPassword("");
      setPin("");
      setConfirmPin("");
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      setSuccessMessage("");
      setModalStep("password");
    }

    window.addEventListener(
      "aris-pay:open-transfer-pin-create",
      openCreatePinFlow,
    );
    return () =>
      window.removeEventListener(
        "aris-pay:open-transfer-pin-create",
        openCreatePinFlow,
      );
  }, []);

  async function handlePasswordVerification() {
    if (!token || !password) {
      toast.error("Enter your password to continue.");
      return;
    }

    setLoading("password");
    try {
      const response = await settingsService.verifySecurityPassword(
        token,
        password,
      );
      if (response.statusCode !== 200) {
        toast.error(response.message || "Unable to verify password.");
        return;
      }

      setModalStep("pin");
      toast.success("Password verified.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify password.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handlePinSubmit() {
    if (!token || !password) {
      toast.error("Restart the flow and confirm your password again.");
      return;
    }

    if (intent === "create") {
      if (!/^\d{6}$/.test(pin)) {
        toast.error("PIN must be a 6-digit number.");
        return;
      }

      if (pin !== confirmPin) {
        toast.error("PIN confirmation does not match.");
        return;
      }
    } else {
      if (!oldPin) {
        toast.error("Enter your current PIN.");
        return;
      }
      if (!/^\d{6}$/.test(newPin)) {
        toast.error("New PIN must be a 6-digit number.");
        return;
      }
      if (newPin !== confirmNewPin) {
        toast.error("New PIN confirmation does not match.");
        return;
      }
    }

    setLoading("pin");
    try {
      const response =
        intent === "create"
          ? await settingsService.createPaymentPin(token, {
              password,
              pin,
              confirmPin,
            })
          : await settingsService.changePaymentPin(token, {
              password,
              oldPin,
              newPin,
              confirmNewPin,
            });

      if (response.statusCode !== 200) {
        toast.error(response.message || "Unable to update payment PIN.");
        return;
      }

      onPinUpdated(true);
      setSuccessMessage(
        intent === "create"
          ? "Your transfer PIN has been created successfully."
          : "Your transfer PIN has been changed successfully.",
      );
      setModalStep("success");
      toast.success(response.message || "Payment PIN updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update payment PIN.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Card className="dashboard-surface-card px-8 py-9">
        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-[8px] border border-[var(--border)] bg-white p-6">
            <p className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
              Security Settings
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[#667085]">
              Manage transfer authorization for your business. We&apos;ll always
              confirm your password before any payment PIN change.
            </p>
            <div className="mt-6 grid gap-4">
              <DetailsRow
                label="Transfer PIN Status"
                value={hasPaymentPin ? "active" : "not set"}
              />
              <DetailsRow
                label="Security Rule"
                value={
                  hasPaymentPin
                    ? "PIN required for payouts"
                    : "Create a PIN to protect transfers"
                }
              />
            </div>
          </section>

          <section className="rounded-[8px] border border-[var(--border)] bg-[#fbfcfd] p-6">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#667085] shadow-sm">
                <ScanIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[18px] font-semibold text-[#101828]">
                  Payment PIN
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#667085]">
                  {hasPaymentPin
                    ? "Your 6-digit transfer PIN is active and will be required when completing transfers."
                    : "Create a 6-digit transfer PIN to secure payouts and transfer approvals."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex rounded-[6px] px-3 py-1 text-xs font-semibold",
                      hasPaymentPin
                        ? "bg-[var(--brand-soft)] text-[var(--brand-deep)]"
                        : "bg-[#fff4e5] text-[#c26a00]",
                    )}
                  >
                    {hasPaymentPin ? "Active" : "Not Set"}
                  </span>
                  <Button
                    onClick={() =>
                      openFlow(hasPaymentPin ? "change" : "create")
                    }
                  >
                    {hasPaymentPin ? "Change PIN" : "Create PIN"}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Card>

      <Modal
        open={modalStep !== "closed"}
        onClose={resetFlow}
        title={
          modalStep === "password"
            ? intent === "create"
              ? "Confirm your password"
              : "Confirm your password"
            : modalStep === "pin"
              ? intent === "create"
                ? "Create transfer PIN"
                : "Change transfer PIN"
              : "PIN updated"
        }
        description={
          modalStep === "password"
            ? "Enter your account password before managing your transfer PIN."
            : modalStep === "pin"
              ? intent === "create"
                ? "Create a 6-digit PIN for approving transfers."
                : "Update the 6-digit PIN used for approving transfers."
              : successMessage
        }
        maxWidthClassName="max-w-lg"
      >
        {modalStep === "password" ? (
          <div className="space-y-5">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 border border-[#d0d5dd] bg-white px-5 text-[#344054] hover:bg-[#f8fafb] hover:text-[#1f2937]"
                onClick={resetFlow}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={loading === "password"}
                className="dashboard-black-button h-11 px-5"
                onClick={() => void handlePasswordVerification()}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {modalStep === "pin" ? (
          <div className="space-y-5">
            {intent === "create" ? (
              <>
                <Input
                  label="Enter PIN"
                  type="password"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  fieldClassName="border-transparent bg-[#f3f5f8]"
                  placeholder="Enter 6-digit PIN"
                />
                <Input
                  label="Re-enter PIN"
                  type="password"
                  value={confirmPin}
                  onChange={(event) =>
                    setConfirmPin(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  fieldClassName="border-transparent bg-[#f3f5f8]"
                  placeholder="Re-enter 6-digit PIN"
                />
              </>
            ) : (
              <>
                <Input
                  label="Old PIN"
                  type="password"
                  value={oldPin}
                  onChange={(event) =>
                    setOldPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  fieldClassName="border-transparent bg-[#f3f5f8]"
                  placeholder="Enter current 6-digit PIN"
                />
                <Input
                  label="New PIN"
                  type="password"
                  value={newPin}
                  onChange={(event) =>
                    setNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  fieldClassName="border-transparent bg-[#f3f5f8]"
                  placeholder="Enter new 6-digit PIN"
                />
                <Input
                  label="Confirm New PIN"
                  type="password"
                  value={confirmNewPin}
                  onChange={(event) =>
                    setConfirmNewPin(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  fieldClassName="border-transparent bg-[#f3f5f8]"
                  placeholder="Re-enter new 6-digit PIN"
                />
              </>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 border border-[#d0d5dd] bg-white px-5 text-[#344054] hover:bg-[#f8fafb] hover:text-[#1f2937]"
                onClick={resetFlow}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={loading === "pin"}
                className="dashboard-black-button h-11 px-5"
                onClick={() => void handlePinSubmit()}
              >
                {intent === "create" ? "Create PIN" : "Change PIN"}
              </Button>
            </div>
          </div>
        ) : null}

        {modalStep === "success" ? (
          <div className="space-y-5">
            <div className="rounded-[18px] bg-[#f8fafb] p-5 text-sm leading-6 text-[#667085]">
              {successMessage}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                className="dashboard-black-button h-11 px-5"
                onClick={resetFlow}
              >
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function getRoleBadgeClassName(role?: string | null) {
  switch (String(role || "").toLowerCase()) {
    case "owner":
      return "bg-[#e8f1ff] text-[#1b66c9]";
    case "admin":
      return "bg-[#efe8ff] text-[#6941c6]";
    case "developer":
      return "bg-[#fff7d7] text-[#a35c00]";
    default:
      return "bg-[#fff1df] text-[#d06b12]";
  }
}

function TeamPanel({
  members,
  onInvite,
}: {
  members: BusinessTeamMember[];
  onInvite: () => void;
}) {
  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white px-8 py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[18px] font-semibold text-[#101828]">
          Team Management
        </p>
        <Button className="dashboard-black-button w-[154px]" onClick={onInvite}>
          Invite Member
        </Button>
      </div>

      <div className="mt-7 overflow-hidden rounded-[10px] border border-[#eef1f5]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[14px]">
            <thead className="bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
              <tr>
                <th className="px-6 py-4">Users</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Primary Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="w-16 px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {members.map((member) => {
                const fullName =
                  `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                  "Team Member";
                const initials =
                  `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase() ||
                  "TM";
                return (
                  <tr key={member._id} className="bg-white">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[13px] font-semibold text-[var(--brand-deep)]">
                          {initials}
                        </span>
                        <span className="font-semibold text-[#344054]">
                          {fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[#667085]">
                      {member.emailAddress}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                          getRoleBadgeClassName(member.role),
                        )}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge value={member.status || "Pending"} />
                    </td>
                    <td className="px-6 py-5 text-right text-[#98a2b3]">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f5f8]"
                      >
                        <MoreIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function SettingsDrawerShell({
  open,
  title,
  onClose,
  children,
}: React.PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside className="relative flex h-full w-full max-w-[486px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 py-7">
          <h2 className="text-[22px] font-semibold text-[#101828]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5f8] text-[#667085]"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="border-t border-dashed border-[#d0d5dd]" />
        {children}
      </aside>
    </div>
  );
}

function InviteMemberDrawer({
  open,
  onClose,
  loading,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onInvite: (payload: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    role: "admin" | "support" | "developer";
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"admin" | "support" | "developer">(
    "support",
  );

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setEmailAddress("");
      setPhoneNumber("");
      setRole("support");
    }
  }, [open]);

  return (
    <SettingsDrawerShell open={open} title="Invite Member" onClose={onClose}>
      <form
        className="flex flex-1 flex-col px-8 py-8"
        onSubmit={async (event) => {
          event.preventDefault();
          await onInvite({
            firstName,
            lastName,
            emailAddress,
            phoneNumber,
            role,
          });
        }}
      >
        <div className="grid gap-5">
          <Input
            placeholder="First Name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            fieldClassName="border-transparent bg-[#f3f5f8]"
            aria-label="First Name"
          />
          <Input
            placeholder="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            fieldClassName="border-transparent bg-[#f3f5f8]"
            aria-label="Last Name"
          />
          <Input
            placeholder="Email"
            type="email"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            fieldClassName="border-transparent bg-[#f3f5f8]"
            aria-label="Email"
          />
          <Input
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            fieldClassName="border-transparent bg-[#f3f5f8]"
            aria-label="Phone Number"
          />
          <label className="block">
            <span className="mb-2 block text-[14px] font-semibold text-[#344054]">
              Role
            </span>
            <span className="flex h-10 items-center rounded-[10px] border border-transparent bg-[#f3f5f8] px-4">
              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as "admin" | "support" | "developer",
                  )
                }
                className="h-full w-full bg-transparent text-[14px] font-medium text-[#344054] outline-none"
              >
                <option value="support">Support</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
            </span>
          </label>
        </div>
        <Button
          type="submit"
          loading={loading}
          className="dashboard-black-button mt-auto w-full"
        >
          Invite
        </Button>
      </form>
    </SettingsDrawerShell>
  );
}

function UploadImageDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SettingsDrawerShell open={open} title="Upload Image" onClose={onClose}>
      <div className="flex flex-1 flex-col items-center px-8 py-12">
        <button
          type="button"
          className="flex h-[230px] w-[230px] flex-col items-center justify-center rounded-full bg-[var(--brand-soft)] text-center text-[var(--brand-deep)]"
        >
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#b7dfc9] bg-white">
            <UserSquareIcon className="h-6 w-6" />
          </span>
          <span className="text-[14px] font-semibold">
            Click to add a photo
          </span>
        </button>

        <div className="mt-10 w-full rounded-[12px] border border-[#eef1f5] bg-[#f8fafb] p-5">
          <p className="text-[14px] font-semibold text-[#344054]">
            File Upload Guideline
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[#98a2b3]">
            Upload a clear JPG, PNG, or SVG file. Keep the image centered and
            under 2MB for the best result.
          </p>
        </div>
      </div>
    </SettingsDrawerShell>
  );
}
