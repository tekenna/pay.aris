export {
  accountsService,
  authService,
  checkoutService,
  dashboardService,
  developersService,
  paymentsService,
  settingsService,
  transactionsService,
} from "@/services";

import {
  accountsService,
  authService,
  checkoutService,
  dashboardService,
  developersService,
  paymentsService,
  settingsService,
  transactionsService,
} from "@/services";

export const merchantApi = {
  ...authService,
  ...dashboardService,
  ...accountsService,
  ...paymentsService,
  ...checkoutService,
  ...transactionsService,
  ...settingsService,
  ...developersService,
};
