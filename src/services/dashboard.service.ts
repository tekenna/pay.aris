"use client";

import type { MerchantDashboardOverview } from "@/lib/types";
import { apiRequest } from "@/services/api-client";

export const dashboardService = {
  getOverview(token: string, days = 7) {
    return apiRequest<MerchantDashboardOverview>(
      `/businesses/dashboard/overview?days=${days}`,
      { token },
    );
  },
};
