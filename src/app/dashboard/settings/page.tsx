"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { useBusinessSession } from "@/store/business-session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import {
  ChevronDown,
  MoreIcon,
  ScanIcon,
  UserSquareIcon,
  XIcon,
} from "@/components/ui/icons";
import { merchantApi } from "@/lib/merchant-api";
import type { Business, CheckoutConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "compliance" | "checkout" | "security" | "team";
type SettingsDrawer = "invite" | "upload" | null;

const teamRows = [
  {
    name: "Amos Bwala",
    initials: "AE",
    email: "amos1@gmail.com",
    role: "Accountant",
    status: "Active",
    roleClassName: "bg-[#efe8ff] text-[#6941c6]",
  },
  {
    name: "Dolapo Ojo",
    initials: "AE",
    email: "ojod1@yahoo.com",
    role: "Auditor",
    status: "Pending",
    roleClassName: "bg-[#fff1df] text-[#d06b12]",
  },
  {
    name: "Khattab Yahaya",
    initials: "AE",
    email: "yk100@gmail.com",
    role: "Developer",
    status: "Active",
    roleClassName: "bg-[#fff7d7] text-[#a35c00]",
  },
  {
    name: "Abel Samson",
    initials: "AE",
    email: "abel001@gmail.com",
    role: "Owner",
    status: "Active",
    roleClassName: "bg-[#e8f1ff] text-[#1b66c9]",
  },
];

export default function SettingsPage() {
  const { session, setSession } = useBusinessSession();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [drawer, setDrawer] = useState<SettingsDrawer>(null);
  const [profile, setProfile] = useState<Business | null>(null);
  const [checkout, setCheckout] = useState<CheckoutConfig>({
    primaryColor: "#0F172A",
    secondaryColor: "#16A34A",
  });
  const [isSavingCheckout, setIsSavingCheckout] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "compliance") {
      setTab("compliance");
    }

    function openCompliance() {
      setTab("compliance");
    }

    window.addEventListener("aris-pay:open-compliance", openCompliance);
    return () => window.removeEventListener("aris-pay:open-compliance", openCompliance);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!session?.token) {
        return;
      }

      const [profileResponse, checkoutResponse] = await Promise.all([
        merchantApi.getProfile(session.token),
        merchantApi.getCheckoutConfig(session.token),
      ]);

      if (profileResponse.statusCode === 200) {
        setProfile(profileResponse.data);
      }

      if (checkoutResponse.statusCode === 200) {
        setCheckout(checkoutResponse.data);
      }
    }

    void loadData();
  }, [session?.token]);

  const businessName = profile?.businessName || session?.business.businessName || "Aris Wallex";
  const email = profile?.emailAddress || session?.business.emailAddress || "ariswallex@gmail.com";
  const phoneNumber = profile?.phoneNumber || session?.business.phoneNumber || "+234 709 674 3456";
  const address = profile?.address || session?.business.address;

  return (
    <MerchantShell title="Settings">
      <Tabs
        value={tab}
        onChange={(nextTab) => setTab(nextTab as SettingsTab)}
        items={[
          { label: "Profile", value: "profile" },
          { label: "Compliance", value: "compliance" },
          { label: "Checkout Preferences", value: "checkout" },
          { label: "Security", value: "security" },
          { label: "Team", value: "team" },
        ]}
      />

      {tab === "profile" ? (
        <ProfilePanel
          businessName={businessName}
          email={email}
          phoneNumber={phoneNumber}
          addressLine={address?.street || "Brains & Hammers Estate Abuja"}
          city={address?.city || "Abuja"}
          state={address?.state || "Abuja"}
          onUpload={() => setDrawer("upload")}
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
              const response = await merchantApi.updateCheckoutConfig(session.token, {
                ...checkout,
              });

              if (response.statusCode === 200) {
                setCheckout(response.data);
              }
            } finally {
              setIsSavingCheckout(false);
            }
          }}
        />
      ) : null}

      {tab === "security" ? <SecurityPanel /> : null}
      {tab === "team" ? <TeamPanel onInvite={() => setDrawer("invite")} /> : null}

      <InviteMemberDrawer open={drawer === "invite"} onClose={() => setDrawer(null)} />
      <UploadImageDrawer open={drawer === "upload"} onClose={() => setDrawer(null)} />
    </MerchantShell>
  );
}

function ProfilePanel({
  businessName,
  email,
  phoneNumber,
  addressLine,
  city,
  state,
  onUpload,
}: {
  businessName: string;
  email: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  state: string;
  onUpload: () => void;
}) {
  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white px-8 py-10">
      <div className="grid gap-10 lg:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex justify-center lg:justify-start">
          <div className="relative h-[128px] w-[128px] rounded-full bg-[radial-gradient(circle_at_50%_24%,#f7d7bd_0_17%,#111827_18%_28%,#d7f3e7_29%_57%,#e8f6ef_58%_100%)] shadow-sm">
            <button
              type="button"
              onClick={onUpload}
              className="absolute bottom-2 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#0a9550] text-white shadow-sm"
              aria-label="Upload business image"
            >
              <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-current" />
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="border-t border-[#eceff4] pt-7">
            <p className="text-[16px] font-semibold text-[#111827]">Basic Details</p>
            <div className="mt-5 divide-y divide-[#eef1f5] border-t border-[#eef1f5]">
              <DetailsRow label="Business Name" value={businessName} />
              <DetailsRow label="Email" value={email} />
              <DetailsRow label="Phone Number" value={phoneNumber} />
            </div>
          </div>

          <div className="mt-12">
            <p className="text-[16px] font-semibold text-[#111827]">Address</p>
            <div className="mt-5 divide-y divide-[#eef1f5] border-t border-[#eef1f5]">
              <DetailsRow label="Address Line 1" value={addressLine} />
              <DetailsRow label="City" value={city} />
              <DetailsRow label="State" value={state} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-[66px] items-center gap-2 py-4 text-[14px] md:grid-cols-[220px_minmax(0,1fr)]">
      <p className="font-medium text-[#98a2b3]">{label}</p>
      <p className="font-semibold text-[#344054]">{value}</p>
    </div>
  );
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
  const kycStatus = profile?.kyc?.status || "not_submitted";
  const businessStatus = String(profile?.status || "pending").toLowerCase();
  const isBusinessActive = businessStatus === "active";
  const [identityType, setIdentityType] = useState(profile?.kyc?.identityType || "BVN");
  const [identityNumber, setIdentityNumber] = useState(profile?.kyc?.identityNumber || "");
  const [identityId, setIdentityId] = useState(profile?.kyc?.identityId || "");
  const [otp, setOtp] = useState("");
  const [identityVerified, setIdentityVerified] = useState(Boolean(profile?.kyc?.identityId));
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<"identity" | "otp" | "save" | null>(null);

  useEffect(() => {
    if (!cacFile || !cacFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(cacFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cacFile]);

  if (kycStatus === "pending") {
    return (
      <Card className="min-h-[520px] border-[#eef1f5] bg-white p-8">
        <div className="flex max-w-[560px] flex-col items-start">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7e6] text-[#d98a00]">
            <ScanIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-6 text-[22px] font-bold text-[#101828]">Compliance review pending</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#667085]">
            Your business compliance details have been submitted and are awaiting admin approval.
            Your business will remain pending until an admin completes the review and activates it.
          </p>
          <div className="mt-7 rounded-full bg-[#fff7e6] px-4 py-2 text-[13px] font-semibold text-[#c26a00]">
            Pending approval
          </div>
        </div>
      </Card>
    );
  }

  if (kycStatus === "approved" && !isBusinessActive) {
    return (
      <Card className="min-h-[520px] border-[#eef1f5] bg-white p-8">
        <div className="max-w-[680px]">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7e6] text-[#d98a00]">
            <ScanIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-6 text-[22px] font-bold text-[#101828]">Compliance approved, activation pending</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#667085]">
            Your compliance review has been completed, but your business is not active yet.
            An admin still needs to activate the business before the dashboard becomes fully active.
          </p>
          <div className="mt-8 divide-y divide-[#eef1f5] rounded-[12px] border border-[#eef1f5]">
            <DetailsRow label="Business Status" value={profile?.status || "Pending"} />
            <DetailsRow label="Compliance Status" value={profile?.kyc?.status || "approved"} />
            <DetailsRow label="Main Account Number" value={profile?.safehaven?.accountNumber || "--"} />
          </div>
        </div>
      </Card>
    );
  }

  if (kycStatus === "approved" && isBusinessActive) {
    return (
      <Card className="min-h-[520px] border-[#eef1f5] bg-white p-8">
        <div className="max-w-[680px]">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f6ef] text-[#0a9550]">
            <UserSquareIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-6 text-[22px] font-bold text-[#101828]">Compliance approved</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#667085]">
            Your business is verified, active, and your default Safehaven settlement account has been created.
          </p>
          <div className="mt-8 divide-y divide-[#eef1f5] rounded-[12px] border border-[#eef1f5]">
            <DetailsRow label="Account Name" value={profile?.safehaven?.accountName || "--"} />
            <DetailsRow label="Account Number" value={profile?.safehaven?.accountNumber || "--"} />
            <DetailsRow label="Bank" value={profile?.safehaven?.bankName || "Safehaven MFB"} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white p-8">
      <div className="max-w-[720px]">
        <p className="text-[18px] font-semibold text-[#101828]">Business Compliance</p>
        <p className="mt-2 text-[14px] leading-6 text-[#667085]">
          Verify a director identity, upload the CAC document, and create your default business settlement account.
        </p>
        {kycStatus === "rejected" ? (
          <div className="mt-5 rounded-[12px] border border-[#ffd6d6] bg-[#fff5f5] p-4 text-[13px] font-medium text-[#d33a44]">
            {profile?.kyc?.rejectionReason || "Your previous submission was rejected. Please review and submit again."}
          </div>
        ) : null}

        <form
          className="mt-8 grid gap-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!token || !cacFile || !identityId || !identityVerified) {
              toast.error("Complete identity verification and upload CAC before saving.");
              return;
            }

            setLoadingStep("save");
            try {
              const response = await merchantApi.submitCorporateKyc(token, {
                identityType,
                identityNumber,
                identityId,
                cac: cacFile,
              });

              if (response.statusCode !== 200) {
                toast.error(response.message || "Unable to submit compliance.");
                return;
              }

              onApproved(response.data);
              toast.success(response.message || "Compliance submitted and pending admin approval.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to submit compliance.");
            } finally {
              setLoadingStep(null);
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[14px] font-semibold text-[#202433]">Identity Type</span>
              <span className="flex h-10 items-center rounded-[10px] bg-[#f3f5f8] px-4">
                <select
                  value={identityType}
                  onChange={(event) => {
                    setIdentityType(event.target.value);
                    setIdentityVerified(false);
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
                setIdentityVerified(false);
                setIdentityId("");
              }}
              placeholder="Enter identity number"
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <Button
              type="button"
              loading={loadingStep === "identity"}
              disabled={!identityType || !identityNumber}
              className="dashboard-black-button w-[190px]"
              onClick={async () => {
                if (!token) return;
                setLoadingStep("identity");
                try {
                  const response = await merchantApi.initiateBusinessIdentity(token, {
                    identityType,
                    identityNumber,
                  });

                  if (response.statusCode !== 200 || !response.data?.identityId) {
                    toast.error(response.message || "Unable to initiate identity verification.");
                    return;
                  }

                  setIdentityId(response.data.identityId);
                  toast.success("OTP sent for identity verification.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to initiate identity verification.");
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
                fieldClassName="border-transparent bg-[#f3f5f8]"
              />
            ) : null}
            {identityId ? (
              <Button
                type="button"
                loading={loadingStep === "otp"}
                disabled={!otp}
                className="dashboard-soft-green-button w-[160px]"
                onClick={async () => {
                  if (!token) return;
                  setLoadingStep("otp");
                  try {
                    const response = await merchantApi.validateBusinessIdentity(token, {
                      identityType,
                      identityId,
                      otp,
                    });

                    if (response.statusCode !== 200) {
                      toast.error(response.message || "Unable to verify OTP.");
                      return;
                    }

                    setIdentityVerified(true);
                    toast.success("Identity verified.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to verify OTP.");
                  } finally {
                    setLoadingStep(null);
                  }
                }}
              >
                Confirm OTP
              </Button>
            ) : null}
          </div>

          {identityVerified ? (
            <div className="rounded-[12px] border border-dashed border-[#b7dfc9] bg-[#f8fffb] p-5">
              <p className="text-[14px] font-semibold text-[#101828]">CAC Document</p>
              <label className="mt-4 flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[10px] bg-white px-4 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => setCacFile(event.target.files?.[0] || null)}
                />
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="CAC preview" className="max-h-[108px] rounded-[8px] object-contain" />
                ) : (
                  <>
                    <UserSquareIcon className="h-8 w-8 text-[#0a9550]" />
                    <span className="mt-3 text-[14px] font-semibold text-[#344054]">
                      {cacFile?.name || "Click to upload CAC document"}
                    </span>
                    <span className="mt-1 text-[12px] text-[#98a2b3]">PDF, PNG, or JPG accepted</span>
                  </>
                )}
              </label>
            </div>
          ) : null}

          <Button
            type="submit"
            loading={loadingStep === "save"}
            disabled={!identityVerified || !cacFile}
            className="dashboard-black-button w-[168px]"
          >
            Save
          </Button>
        </form>
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
        <p className="text-[18px] font-semibold text-[#111827]">Checkout Preferences</p>
        <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#667085]">
          Control the branding and developer checkout defaults customers see while making payments.
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
            onChange={(event) => onChange((current) => ({ ...current, logoUrl: event.target.value }))}
            fieldClassName="border-transparent bg-[#f3f5f8]"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Primary Color"
              value={checkout.primaryColor || ""}
              onChange={(event) => onChange((current) => ({ ...current, primaryColor: event.target.value }))}
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
            <Input
              label="Secondary Color"
              value={checkout.secondaryColor || ""}
              onChange={(event) => onChange((current) => ({ ...current, secondaryColor: event.target.value }))}
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Callback URL"
              value={checkout.callbackUrl || ""}
              onChange={(event) => onChange((current) => ({ ...current, callbackUrl: event.target.value }))}
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
            <Input
              label="Webhook URL"
              value={checkout.webhookUrl || ""}
              onChange={(event) => onChange((current) => ({ ...current, webhookUrl: event.target.value }))}
              fieldClassName="border-transparent bg-[#f3f5f8]"
            />
          </div>
          <Button type="submit" loading={isSaving} className="dashboard-black-button mt-2 w-[168px]">
            Save
          </Button>
        </form>
      </div>
    </Card>
  );
}

function SecurityPanel() {
  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white px-8 py-9">
      <p className="text-[18px] font-semibold text-[#101828]">Change Password</p>
      <div className="mt-7 grid max-w-[464px] gap-5">
        <Input
          placeholder="Old Password"
          type="password"
          fieldClassName="border-transparent bg-[#f3f5f8]"
          aria-label="Old Password"
        />
        <Input
          placeholder="New Password"
          type="password"
          fieldClassName="border-transparent bg-[#f3f5f8]"
          aria-label="New Password"
        />
        <Button className="dashboard-black-button mt-1 w-[196px]">Update</Button>
      </div>

      <div className="my-10 border-t border-[#eef1f5]" />

      <p className="text-[18px] font-semibold text-[#101828]">Set 2FA</p>
      <p className="mt-2 max-w-[620px] text-[14px] leading-6 text-[#667085]">
        Protect your Aris Wallex workspace with an extra verification step when signing in or approving sensitive actions.
      </p>

      <div className="mt-7 grid max-w-[760px] gap-4">
        <SecurityOption
          icon={<ScanIcon className="h-5 w-5" />}
          title="PIN"
          description="Use a 4-digit security PIN to verify your account"
        />
        <SecurityOption
          icon={<UserSquareIcon className="h-5 w-5" />}
          title="Authenticator App"
          description="Use an authenticator app to generate a timely code."
        />
      </div>
    </Card>
  );
}

function SecurityOption({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[74px] items-center justify-between gap-4 rounded-[12px] bg-[#f8fafb] px-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#667085] shadow-sm">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-[#344054]">{title}</span>
          <span className="mt-1 block text-[13px] text-[#98a2b3]">{description}</span>
        </span>
      </div>
      <button
        type="button"
        className="relative h-[26px] w-[46px] shrink-0 rounded-full bg-[#d0d5dd] transition"
        aria-label={`${title} disabled`}
      >
        <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}

function TeamPanel({ onInvite }: { onInvite: () => void }) {
  return (
    <Card className="min-h-[690px] border-[#eef1f5] bg-white px-8 py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[18px] font-semibold text-[#101828]">Team Management</p>
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
              {teamRows.map((row) => (
                <tr key={row.email} className="bg-white">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f6ef] text-[13px] font-semibold text-[#0a9550]">
                        {row.initials}
                      </span>
                      <span className="font-semibold text-[#344054]">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[#667085]">{row.email}</td>
                  <td className="px-6 py-5">
                    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", row.roleClassName)}>
                      {row.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="px-6 py-5 text-right text-[#98a2b3]">
                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f5f8]">
                      <MoreIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
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
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close drawer" />
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

function InviteMemberDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SettingsDrawerShell open={open} title="Invite Member" onClose={onClose}>
      <form
        className="flex flex-1 flex-col px-8 py-8"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <div className="grid gap-5">
          <Input placeholder="Email" type="email" fieldClassName="border-transparent bg-[#f3f5f8]" aria-label="Email" />
          <label className="block">
            <span className="flex h-10 items-center justify-between rounded-[10px] border border-transparent bg-[#f3f5f8] px-4 text-[14px] font-medium text-[#98a2b3]">
              Role
              <ChevronDown className="h-4 w-4 text-[#98a2b3]" />
            </span>
          </label>
        </div>
        <Button type="submit" className="dashboard-black-button mt-auto w-full">
          Invite
        </Button>
      </form>
    </SettingsDrawerShell>
  );
}

function UploadImageDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SettingsDrawerShell open={open} title="Upload Image" onClose={onClose}>
      <div className="flex flex-1 flex-col items-center px-8 py-12">
        <button
          type="button"
          className="flex h-[230px] w-[230px] flex-col items-center justify-center rounded-full bg-[#e8f6ef] text-center text-[#0a9550]"
        >
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#b7dfc9] bg-white">
            <UserSquareIcon className="h-6 w-6" />
          </span>
          <span className="text-[14px] font-semibold">Click to add a photo</span>
        </button>

        <div className="mt-10 w-full rounded-[12px] border border-[#eef1f5] bg-[#f8fafb] p-5">
          <p className="text-[14px] font-semibold text-[#344054]">File Upload Guideline</p>
          <p className="mt-2 text-[13px] leading-6 text-[#98a2b3]">
            Upload a clear JPG, PNG, or SVG file. Keep the image centered and under 2MB for the best result.
          </p>
        </div>
      </div>
    </SettingsDrawerShell>
  );
}
