"use client";

import type {
  Business,
  BusinessTeamMember,
  CheckoutConfig,
} from "@/lib/types";
import { apiRequest } from "@/services/api-client";

export const settingsService = {
  getProfile(token: string) {
    return apiRequest<Business>("/businesses/profile", { token });
  },
  updateProfile(token: string, body: Record<string, unknown>) {
    return apiRequest<Business>("/businesses/profile", {
      method: "PUT",
      token,
      data: body,
    });
  },
  initiateBusinessIdentity(
    token: string,
    body: { identityType: string; identityNumber: string },
  ) {
    return apiRequest<{ identityId?: string; otpId?: string | null }>(
      "/businesses/kyc/identity/initiate",
      { method: "POST", token, data: body },
    );
  },
  validateBusinessIdentity(
    token: string,
    body: { identityType: string; identityId: string; otp: string },
  ) {
    return apiRequest<{
      identityId: string;
      verified: boolean;
      business: Business;
      safehaven?: unknown;
    }>("/businesses/kyc/identity/validate", {
      method: "POST",
      token,
      data: body,
    });
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

    return apiRequest<Business>("/businesses/kyc/corporate", {
      method: "POST",
      token,
      data: formData,
    });
  },
  getCheckoutConfig(token: string) {
    return apiRequest<CheckoutConfig>("/businesses/checkout-config", { token });
  },
  updateCheckoutConfig(token: string, body: Record<string, unknown>) {
    return apiRequest<CheckoutConfig>("/businesses/checkout-config", {
      method: "PUT",
      token,
      data: body,
    });
  },
  getTeamMembers(token: string) {
    return apiRequest<BusinessTeamMember[]>("/businesses/team-members", { token });
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
    return apiRequest<BusinessTeamMember>("/businesses/team-members/invite", {
      method: "POST",
      token,
      data: body,
    });
  },
  verifySecurityPassword(token: string, password: string) {
    return apiRequest<{ hasPaymentPin: boolean }>(
      "/businesses/security/password/verify",
      {
        method: "POST",
        token,
        data: { password },
      },
    );
  },
  createPaymentPin(
    token: string,
    body: { password: string; pin: string; confirmPin: string },
  ) {
    return apiRequest<{ hasPaymentPin: boolean }>(
      "/businesses/security/pin/create",
      {
        method: "POST",
        token,
        data: body,
      },
    );
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
    return apiRequest<{ hasPaymentPin: boolean }>(
      "/businesses/security/pin/change",
      {
        method: "POST",
        token,
        data: body,
      },
    );
  },
};
