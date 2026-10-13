import { test, expect } from '../../fixtures';
import { legendTotals, plottedPoints } from '../../utils/dashboard-api';
import { numPattern, textSequence } from '../../utils/text';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

test.describe('Dashboard Growth vs Downturn chart', () => {
  test('Growth is never negative and Downturn is never positive',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      const { graph } = await dashboardPage.goto();
      for (const point of plottedPoints(graph)) {
        expect.soft(point.growth, JSON.stringify(point)).toBeGreaterThanOrEqual(0);
        expect.soft(point.downturn, JSON.stringify(point)).toBeLessThanOrEqual(0);
      }
    });

  test('tooltip shows each month\'s Growth and Downturn values',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      const { graph } = await dashboardPage.goto();
      // Wait until the chart has drawn this data before hovering.
      await expect(dashboardPage.growthLegend).toHaveText(textSequence('Growth', numPattern(legendTotals(graph).growth)));

      for (const point of graph.dataPoints) {
        const month = MONTHS[point.month - 1];
        await dashboardPage.hoverMonth(month.slice(0, 3), month);
        await expect.soft(dashboardPage.tooltip, month).toHaveText(
          textSequence(month, 'Growth', numPattern(point.growth), 'Downturn', numPattern(point.downturn)),
        );
      }
    });

  test('filtering by Year loads that year\'s data',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      const lastYear = String(new Date().getFullYear() - 1);

      const { url, data } = await dashboardPage.selectYear(lastYear);
      expect(url.searchParams.get('year')).toBe(lastYear);
      expect(url.searchParams.get('type')).toBe('hosts');

      const totals = legendTotals(data);
      await expect(dashboardPage.yearDropdown).toHaveText(lastYear);
      await expect(dashboardPage.growthLegend).toHaveText(textSequence('Growth', numPattern(totals.growth)));
      await expect(dashboardPage.downturnLegend).toHaveText(textSequence('Downturn', numPattern(totals.downturn)));
    });

  test('filtering by Month shows that month\'s weekly data',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      const lastYear = String(new Date().getFullYear() - 1);
      await dashboardPage.selectYear(lastYear);

      const { url, data } = await dashboardPage.selectMonth('March');
      expect(url.searchParams.get('month')).toBe('3');
      expect(url.searchParams.get('year')).toBe(lastYear);

      const totals = legendTotals(data);
      await expect(dashboardPage.monthDropdown).toHaveText('March');
      await expect(dashboardPage.growthLegend).toHaveText(textSequence('Growth', numPattern(totals.growth)));
      await expect(dashboardPage.downturnLegend).toHaveText(textSequence('Downturn', numPattern(totals.downturn)));
    });

  test('Switch Graph toggles between line and bar chart without a page reload',
    { tag: ['@regression', '@NTV-270'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(dashboardPage.chart).toHaveAttribute('aria-label', /^bar chart/);
      await dashboardPage.markDocument();

      // ApexCharts labels the line chart as an "area chart".
      await dashboardPage.selectGraphType('Line Chart');
      await expect(dashboardPage.chart).toHaveAttribute('aria-label', /^(line|area) chart/);

      await dashboardPage.selectGraphType('Bar Chart');
      await expect(dashboardPage.chart).toHaveAttribute('aria-label', /^bar chart/);

      expect(await dashboardPage.wasReloaded()).toBe(false);
    });
});
