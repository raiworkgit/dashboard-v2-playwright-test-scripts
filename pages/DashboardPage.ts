import { Page, Locator, Response, expect } from '@playwright/test';
import type { DashboardGlobal, DashboardGraph, RaspiModel } from '../utils/dashboard-api';

/*
 * Selector notes — elements without a data-testid yet (requested from devs):
 * - Summary/bottom cards, the graph card, its 3 dropdowns and the donut center
 *   have no testid or accessible name, so they are located by their Angular
 *   component tag (app-stats-card, ntv-graph, ntv-dropdown, ntv-donut-graph)
 *   or the donut's data-total attribute. Swap these for getByTestId once added.
 * - The dropdowns are located by position (Month, Year, Switch Graph) because
 *   their button label changes to the selected value.
 */
export class DashboardPage {
  readonly page: Page;
  readonly statsSection: Locator;
  readonly graphCard: Locator;
  readonly chart: Locator;
  readonly growthLegend: Locator;
  readonly downturnLegend: Locator;
  readonly monthDropdown: Locator;
  readonly yearDropdown: Locator;
  readonly graphTypeDropdown: Locator;
  readonly tooltip: Locator;
  readonly bottomSection: Locator;
  readonly raspiCard: Locator;
  readonly raspiCenterCount: Locator;
  readonly topDealersList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsSection = page.getByTestId('dashboard-stats');

    this.graphCard = page.locator('ntv-graph');
    this.chart = this.graphCard.getByRole('application', { name: /chart with 2 data series/ });
    this.growthLegend = this.graphCard.getByRole('button', { name: /^Growth/ });
    this.downturnLegend = this.graphCard.getByRole('button', { name: /^Downturn/ });
    const dropdowns = this.graphCard.locator('ntv-dropdown');
    this.monthDropdown = dropdowns.nth(0).getByRole('button');
    this.yearDropdown = dropdowns.nth(1).getByRole('button');
    this.graphTypeDropdown = dropdowns.nth(2).getByRole('button');
    this.tooltip = page.getByRole('tooltip').filter({ hasText: 'Comparison' });

    this.bottomSection = page.getByTestId('dashboard-player-stats');
    this.raspiCard = this.bottomSection.locator('ntv-donut-graph');
    this.raspiCenterCount = this.raspiCard.locator('[data-total]');
    this.topDealersList = this.bottomSection.getByRole('list');
  }

  /** Opens the dashboard and returns the API data the page loaded. */
  async goto() {
    const [global, graph, raspi] = await Promise.all([
      this.waitForApi<DashboardGlobal>('/api/dashboard/global'),
      this.waitForGraph(),
      this.waitForApi<RaspiModel[]>('/api/dashboard/raspi'),
      this.page.goto('/dashboard'),
    ]);
    await expect(this.statsSection).toBeVisible();
    return { global, graph: graph.data, graphUrl: graph.url, raspi };
  }

  summaryCard(title: string) {
    return this.statsSection
      .locator('app-stats-card')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  /** Clicks a summary card and returns the graph data it loaded. */
  async selectSummaryCard(title: string) {
    const [graph] = await Promise.all([
      this.waitForGraph(),
      this.summaryCard(title).getByRole('heading', { name: title, exact: true }).click(),
    ]);
    return graph;
  }

  async selectMonth(month: string) {
    return this.pickGraphFilter(this.monthDropdown, month);
  }

  async selectYear(year: string) {
    return this.pickGraphFilter(this.yearDropdown, year);
  }

  async selectGraphType(type: 'Line Chart' | 'Bar Chart') {
    await this.graphTypeDropdown.click();
    await this.page.getByRole('option', { name: type, exact: true }).click();
  }

  /**
   * Hovers the chart above a month label until its tooltip shows that month.
   * ApexCharts throttles mouse moves, so the tooltip can lag on a month the
   * pointer passed over; nudging the pointer and re-checking settles it.
   */
  async hoverMonth(shortMonth: string, fullMonth: string) {
    const label = this.chart.getByText(shortMonth, { exact: true }).first();
    let nudge = 0;
    await expect(async () => {
      const labelBox = await label.boundingBox();
      const chartBox = await this.chart.boundingBox();
      if (!labelBox || !chartBox) throw new Error(`Chart or month label "${shortMonth}" is not visible`);
      nudge = nudge === 2 ? -2 : 2;
      await this.page.mouse.move(labelBox.x + labelBox.width / 2 + nudge, chartBox.y + chartBox.height / 2, { steps: 3 });
      await expect(this.tooltip).toContainText(fullMonth, { timeout: 1_000 });
    }).toPass({ timeout: 10_000 });
  }

  bottomCard(title: string) {
    return this.bottomSection
      .locator('app-stats-card')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  raspiLegendItem(model: string) {
    return this.raspiCard.getByTitle(model, { exact: true });
  }

  topDealersHeading(title: string) {
    return this.bottomSection.getByRole('heading', { name: title, exact: true });
  }

  /** Marks the current document so a test can later confirm no full page reload happened. */
  async markDocument() {
    await this.page.evaluate(() => ((window as any).__e2eNoReload = true));
  }

  async wasReloaded() {
    return !(await this.page.evaluate(() => (window as any).__e2eNoReload === true));
  }

  private async pickGraphFilter(dropdown: Locator, option: string) {
    await dropdown.click();
    const [graph] = await Promise.all([
      this.waitForGraph(),
      this.page.getByRole('option', { name: option, exact: true }).click(),
    ]);
    return graph;
  }

  private async waitForGraph() {
    const response = await this.page.waitForResponse(
      (r) => r.url().includes('/api/dashboard/graph') && r.request().method() === 'GET',
    );
    return { url: new URL(response.url()), data: await this.json<DashboardGraph>(response) };
  }

  private async waitForApi<T>(path: string): Promise<T> {
    const response = await this.page.waitForResponse(
      (r) => new URL(r.url()).pathname === path && r.request().method() === 'GET',
    );
    return this.json<T>(response);
  }

  private async json<T>(response: Response): Promise<T> {
    if (response.status() === 401) {
      throw new Error(
        'Saved session is no longer valid (401). The account allows one active session, so logging in ' +
        'elsewhere kicks this one out. Run `npm run auth:save` again.',
      );
    }
    expect(response.status(), `${response.url()} status`).toBe(200);
    return (await response.json()).data as T;
  }
}
