import { test, expect } from '../../fixtures';
import { SUMMARY_CARDS, legendTotals } from '../../utils/dashboard-api';
import { numPattern, textSequence } from '../../utils/text';

test.describe('Dashboard summary cards', () => {
  test('shows Total Hosts, Dealers, Advertisers and Licenses cards',
    { tag: ['@smoke', '@NTV-270'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      for (const card of SUMMARY_CARDS) {
        await expect(dashboardPage.summaryCard(card.title)).toBeVisible();
      }
    });

  test('each card total, This Week and Last Week match the API',
    { tag: ['@smoke', '@NTV-270'] },
    async ({ dashboardPage }) => {
      const { global } = await dashboardPage.goto();
      for (const card of SUMMARY_CARDS) {
        const counts = card.counts(global);
        await expect.soft(dashboardPage.summaryCard(card.title), card.title).toHaveText(
          textSequence(card.title, numPattern(counts.overall),
            'This Week', numPattern(counts.thisWeek), 'Last Week', numPattern(counts.lastWeek)),
        );
      }
    });

  test('Total Hosts is selected by default and the chart shows hosts data',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      const { graph, graphUrl } = await dashboardPage.goto();
      expect(graphUrl.searchParams.get('type')).toBe('hosts');

      const totals = legendTotals(graph);
      await expect(dashboardPage.growthLegend).toHaveText(textSequence('Growth', numPattern(totals.growth)));
      await expect(dashboardPage.downturnLegend).toHaveText(textSequence('Downturn', numPattern(totals.downturn)));
      await expect(dashboardPage.graphCard).toContainText(textSequence('Active:', numPattern(graph.active)));
    });

  for (const card of SUMMARY_CARDS.filter((c) => c.title !== 'Total Hosts')) {
    test(`selecting ${card.title} updates the chart to ${card.graphType} data`,
      { tag: ['@regression', '@NTV-270'] },
      async ({ dashboardPage }) => {
        await dashboardPage.goto();
        const { url, data } = await dashboardPage.selectSummaryCard(card.title);
        expect(url.searchParams.get('type')).toBe(card.graphType);

        const totals = legendTotals(data);
        await expect(dashboardPage.growthLegend).toHaveText(textSequence('Growth', numPattern(totals.growth)));
        await expect(dashboardPage.downturnLegend).toHaveText(textSequence('Downturn', numPattern(totals.downturn)));
        await expect(dashboardPage.graphCard).toContainText(textSequence('Active:', numPattern(data.active)));
      });
  }

  // UAC: selected card has a brand-green glow; unselected cards have none.
  // Only detectable via CSS classes/styles today, and the UI shows red, not green.
  // Re-enable once devs expose the state (e.g. aria-pressed) and the color is confirmed.
  test.fixme('selected card is highlighted and unselected cards are not',
    { tag: ['@wip', '@NTV-270'] },
    async () => {});
});
