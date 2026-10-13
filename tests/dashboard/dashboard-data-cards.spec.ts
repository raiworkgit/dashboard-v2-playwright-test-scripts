import { test, expect } from '../../fixtures';
import { escapeRegex, numPattern, textSequence } from '../../utils/text';

// The page has no whitespace between values ("9,03435Current Month"); compare rendered text instead.
const INNER = { useInnerText: true };

test.describe('Dashboard bottom data cards', () => {
  test('shows Raspberry Pi Versions, Total Installations and Total Users cards',
    { tag: ['@smoke', '@NTV-273'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(dashboardPage.raspiCard).toContainText('Raspberry Pi Versions');
      await expect(dashboardPage.bottomCard('Total Installations')).toBeVisible();
      await expect(dashboardPage.bottomCard('Total Users')).toBeVisible();
    });

  test('Raspberry Pi legend lists every version with its count',
    { tag: ['@smoke', '@NTV-273'] },
    async ({ dashboardPage }) => {
      const { raspi } = await dashboardPage.goto();
      expect(raspi.length).toBeGreaterThan(0);
      for (const { model, count } of raspi) {
        await expect.soft(dashboardPage.raspiLegendItem(model), model).toBeVisible();
        await expect.soft(dashboardPage.raspiCard, model).toContainText(
          textSequence(escapeRegex(model), numPattern(count)),
        );
      }
    });

  test('Raspberry Pi chart center shows the total count by default',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      const { raspi } = await dashboardPage.goto();
      const total = raspi.reduce((sum, r) => sum + Number(r.count), 0);
      await expect(dashboardPage.raspiCenterCount).toHaveText(new RegExp(`^\\s*${numPattern(total)}\\s*$`));
    });

  test('selecting a Raspberry Pi version shows its count in the chart center',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      const { raspi } = await dashboardPage.goto();
      for (const { model, count } of raspi.slice(0, 3)) {
        await dashboardPage.raspiLegendItem(model).click();
        await expect.soft(dashboardPage.raspiCenterCount, model).toHaveText(new RegExp(`^\\s*${numPattern(count)}\\s*$`));
      }
    });

  // UAC 2.4: the selected segment is emphasized and the others turn lighter.
  // Only detectable via CSS classes today; re-enable once devs expose the state.
  test.fixme('selecting a Raspberry Pi version de-emphasizes the other segments',
    { tag: ['@wip', '@NTV-273'] },
    async () => {});

  test('Total Installations counts match the API',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      const { global } = await dashboardPage.goto();
      const { overall, thisMonth, nextMonth, lastMonth, threeMonthsAgo } = global.installations;
      const card = dashboardPage.bottomCard('Total Installations');

      await expect(card).toContainText(textSequence('Total Installations', numPattern(overall)), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(thisMonth), 'Current Month'), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(nextMonth), 'Upcoming Month'), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(lastMonth), 'Last Month'), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(threeMonthsAgo), 'Last 3 Months'), INNER);
    });

  test('Total Users counts match the API',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      const { global } = await dashboardPage.goto();
      const { all, superAdmin, dealerAdmin, dealer, subDealer } = global.users;
      const card = dashboardPage.bottomCard('Total Users');

      await expect(card).toContainText(textSequence('Total Users', numPattern(all.overall)), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(superAdmin.overall), escapeRegex('Super Admin(s)')), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(dealerAdmin.overall), escapeRegex('Dealer Admin(s)')), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(dealer.overall), escapeRegex('Dealer(s)')), INNER);
      await expect.soft(card).toContainText(textSequence(numPattern(subDealer.overall), escapeRegex('Sub-Dealer(s)')), INNER);
    });

  test('Top Dealers card shows a ranked list (UI only)',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(dashboardPage.topDealersList.getByRole('listitem').first()).toBeVisible();
    });

  test('Top Dealers card is titled "Top Dealers"',
    { tag: ['@regression', '@NTV-273'] },
    async ({ dashboardPage }) => {
      test.fail(true, 'Known bug: card title currently reads "Total Dealers". Remove this line once fixed.');
      await dashboardPage.goto();
      await expect(dashboardPage.topDealersHeading('Top Dealers')).toBeVisible({ timeout: 5_000 });
    });
});
