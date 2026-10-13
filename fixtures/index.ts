import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

type Pages = { dashboardPage: DashboardPage };

export const test = base.extend<Pages>({
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
});
export { expect } from '@playwright/test';
