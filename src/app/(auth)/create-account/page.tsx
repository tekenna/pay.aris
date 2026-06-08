"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import {
  AuthBackButton,
  AuthPrimaryButton,
  AuthSelectInput,
  AuthSplitShell,
  AuthTextInput,
} from "@/features/auth/components/auth-shell";
import stateCities from "../../../../public/state-cities.json";
import { authService } from "@/services/auth.service";
import { useBusinessSession } from "@/store/business-session-provider";

type NigerianState = {
  name: string;
  cities: { name: string }[];
};

function formatNigeriaPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+234${digits.slice(1)}`;
  }

  return `+234${digits}`;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[14px] font-semibold tracking-[0.02em] text-[#111827]">
        {label}
      </span>
      {children}
    </label>
  );
}

type CreateAccountFormState = {
  contactFirstName: string;
  contactLastName: string;
  emailAddress: string;
  phoneNumber: string;
  businessName: string;
  taxIdentificationNumber: string;
  addressCountry: string;
  addressState: string;
  addressCity: string;
  password: string;
  confirmPassword: string;
};

export default function CreateAccountPage() {
  const router = useRouter();
  const {
    registrationDraft,
    setRegistrationDraft,
    setSession,
    clearRegistrationDraft,
  } = useBusinessSession();
  const states = stateCities as NigerianState[];
  const initialState =
    registrationDraft.addressState ||
    states.find((state) => state.name === "Abuja Federal Capital Territory")
      ?.name ||
    states[0]?.name ||
    "";
  const initialCities =
    states
      .find((state) => state.name === initialState)
      ?.cities.map((city) => city.name) || [];

  const [form, setForm] = useState<CreateAccountFormState>({
    contactFirstName: registrationDraft.contactFirstName || "",
    contactLastName: registrationDraft.contactLastName || "",
    emailAddress: registrationDraft.emailAddress || "",
    phoneNumber: registrationDraft.phoneNumber || "",
    businessName: registrationDraft.businessName || "",
    taxIdentificationNumber: "",
    addressCountry: registrationDraft.addressCountry || "Nigeria",
    addressState: initialState,
    addressCity: registrationDraft.addressCity || initialCities[0] || "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const cityOptions = useMemo(() => {
    return (
      states
        .find((state) => state.name === form.addressState)
        ?.cities.map((city) => city.name) || []
    );
  }, [form.addressState, states]);
  const isFormValid =
    form.contactFirstName.trim().length > 0 &&
    form.contactLastName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.emailAddress) &&
    formatNigeriaPhoneNumber(form.phoneNumber).replace(/\D/g, "").length >=
      12 &&
    form.businessName.trim().length > 0 &&
    form.addressState.trim().length > 0 &&
    form.addressCity.trim().length > 0 &&
    form.password.length >= 8 &&
    form.confirmPassword.length >= 8;

  useEffect(() => {
    if (!registrationDraft.token) {
      router.replace("/verify-email");
    }
  }, [registrationDraft.token, router]);

  useEffect(() => {
    if (cityOptions.length && !cityOptions.includes(form.addressCity)) {
      setForm((current) => ({ ...current, addressCity: cityOptions[0] }));
    }
  }, [cityOptions, form.addressCity]);

  function updateForm<K extends keyof CreateAccountFormState>(
    key: K,
    value: CreateAccountFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) {
      toast.error("Complete all required fields before continuing.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    const normalizedPhoneNumber = formatNigeriaPhoneNumber(form.phoneNumber);

    const nextDraft = {
      ...registrationDraft,
      businessName: form.businessName,
      contactFirstName: form.contactFirstName,
      contactLastName: form.contactLastName,
      phoneNumber: normalizedPhoneNumber,
      emailAddress: form.emailAddress,
      taxIdentificationNumber: form.taxIdentificationNumber,
      addressCountry: form.addressCountry,
      addressState: form.addressState,
      addressCity: form.addressCity,
    };

    setRegistrationDraft(nextDraft);
    setSubmitting(true);

    try {
      const response = await authService.registerBusiness({
        token: registrationDraft.token,
        businessName: form.businessName,
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        phoneNumber: normalizedPhoneNumber,
        emailAddress: form.emailAddress,
        password: form.password,
        taxIdentificationNumber: form.taxIdentificationNumber,
        address: {
          city: form.addressCity,
          state: form.addressState,
          country: form.addressCountry,
        },
      });

      if (response.statusCode !== 200 || !response.data?.token) {
        toast.error(response.message || "Unable to create account.");
        return;
      }

      setSession({
        business: response.data.business,
        token: response.data.token,
      });
      clearRegistrationDraft();
      toast.success("Account created successfully.");
      router.push("/onboarding-success");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <AuthSplitShell
        title="Sign Up"
        description="Create your business profile and start receiving customer payments."
        illustration="access"
        contentClassName="max-w-[650px]"
      >
        <form className="grid gap-6 text-left" onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="First Name">
              <AuthTextInput
                name="firstName"
                placeholder="e.g John"
                value={form.contactFirstName}
                onChange={(value) => updateForm("contactFirstName", value)}
                required
              />
            </Field>
            <Field label="Last Name">
              <AuthTextInput
                name="lastName"
                placeholder="e.g Doe"
                value={form.contactLastName}
                onChange={(value) => updateForm("contactLastName", value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Work Email">
              <AuthTextInput
                name="email"
                type="email"
                placeholder="e.g joe@example.com"
                value={form.emailAddress}
                onChange={(value) => updateForm("emailAddress", value)}
                disabled
              />
            </Field>
            <Field label="Phone Number">
              <AuthTextInput
                name="phoneNumber"
                type="tel"
                placeholder="e.g 08012345678"
                value={form.phoneNumber}
                onChange={(value) => updateForm("phoneNumber", value)}
                required
              />
            </Field>
          </div>
          <div className="grid gap-6">
            <Field label="Business Name">
              <AuthTextInput
                name="businessName"
                placeholder="e.g ACME INC"
                value={form.businessName}
                onChange={(value) => updateForm("businessName", value)}
                required
              />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Select Registration Country">
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 z-10 h-[18px] w-[24px] -translate-y-1/2 overflow-hidden rounded-[2px] border border-black/5 bg-white shadow-sm">
                  <span className="block h-full w-1/3 bg-[#008751]" />
                  <span className="absolute left-1/3 top-0 h-full w-1/3 bg-white" />
                  <span className="absolute right-0 top-0 h-full w-1/3 bg-[#008751]" />
                </span>
                <AuthSelectInput
                  name="country"
                  value="Nigeria"
                  onChange={() => undefined}
                  options={["Nigeria"]}
                  className="[&_select]:pl-14"
                  disabled
                />
              </div>
            </Field>
            <Field label="TIN   (Optional)">
              <AuthTextInput
                name="tin"
                placeholder="e.g 12345678-0001"
                value={form.taxIdentificationNumber}
                onChange={(value) =>
                  updateForm("taxIdentificationNumber", value)
                }
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="State">
              <AuthSelectInput
                name="state"
                value={form.addressState}
                onChange={(value) => updateForm("addressState", value)}
                options={states.map((state) => state.name)}
                required
              />
            </Field>
            <Field label="City">
              <AuthSelectInput
                name="city"
                value={form.addressCity}
                onChange={(value) => updateForm("addressCity", value)}
                options={cityOptions}
                required
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Password">
              <AuthTextInput
                name="password"
                type="password"
                placeholder="********"
                value={form.password}
                onChange={(value) => updateForm("password", value)}
                required
              />
            </Field>
            <Field label="Confirm Password">
              <AuthTextInput
                name="confirmPassword"
                type="password"
                placeholder="********"
                value={form.confirmPassword}
                onChange={(value) => updateForm("confirmPassword", value)}
                required
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <AuthBackButton href="/verify-email" />
            <AuthPrimaryButton
              type="submit"
              className="w-full sm:w-[178px]"
              disabled={!isFormValid}
              loading={submitting}
            >
              Continue
            </AuthPrimaryButton>
          </div>

          <p className="pt-2 text-center text-[15px] text-[#5f6b76]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#0e5961] transition hover:text-[#0b4d54]"
            >
              Login
            </Link>
          </p>
        </form>
      </AuthSplitShell>
    </AuthGuard>
  );
}
