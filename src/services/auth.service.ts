"use client";

import type { Business, BusinessSession, BusinessTeamMember } from "@/lib/types";
import { apiRequest } from "@/services/api-client";

export const authService = {
  verifyEmail(emailAddress: string) {
    return apiRequest<{ otpId?: string; recipient?: string }>(
      "/business-auth/verify-email",
      {
        method: "POST",
        data: { emailAddress },
      },
    );
  },
  verifyOtp(otpId: string, otp: string) {
    return apiRequest<{ business: Business; token: string }>(
      "/business-auth/verify-otp",
      {
        method: "POST",
        data: { otpId, otp },
      },
    );
  },
  resendOtp(otpId: string) {
    return apiRequest<{ otpId?: string; recipient?: string }>(
      "/business-auth/resend-otp",
      {
        method: "POST",
        data: { otpId },
      },
    );
  },
  registerBusiness(body: Record<string, unknown>) {
    return apiRequest<{ business: Business; token: string }>(
      "/business-auth/register",
      {
        method: "POST",
        data: body,
      },
    );
  },
  login(emailAddress: string, password: string) {
    return apiRequest<BusinessSession>("/business-auth/login", {
      method: "POST",
      data: { emailAddress, password },
    });
  },
  previewInvitation(token: string) {
    return apiRequest<{
      businessName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      emailAddress?: string | null;
      role?: string | null;
      status?: string | null;
    }>("/business-auth/invitation/preview", {
      method: "POST",
      data: { token },
    });
  },
  acceptInvitation(token: string, password: string) {
    return apiRequest<{ member: BusinessTeamMember }>(
      "/business-auth/invitation/accept",
      {
        method: "POST",
        data: { token, password },
      },
    );
  },
};
