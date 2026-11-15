import { expect, test } from '@playwright/test';
import { login, pageProps, seedPayablesFixtures, shot } from '../helpers';

const ADMIN = 'admin@example.com';

type PayablesProps = {
    summary: {
        sellers: { owed_to_sellers: number };
        customers: { total_refunds: number; pending_count: number };
    };
};

/**
 * P-07: the admin payables page shows what the platform owes, and marking a
 * payout paid / a refund processed updates the totals. Fixtures are seeded
 * directly (a requested payout for Barakah Pantry and an unprocessed refund)
 * so the spec does not depend on other specs' order state.
 */
test.describe.serial('admin payables', () => {
    let fixtures: ReturnType<typeof seedPayablesFixtures>;

    test.beforeAll(() => {
        fixtures = seedPayablesFixtures();
    });

    test('admin sees owed totals and the pending payout request', async ({
        page,
    }) => {
        await login(page, ADMIN);
        await page.goto('/admin/payouts');
        await expect(page).toHaveURL(/admin\/payouts/);

        await expect(
            page.getByRole('heading', { name: 'Payables & Payouts' }),
        ).toBeVisible();
        await expect(page.getByText('Sellers Payable').first()).toBeVisible();
        await expect(page.getByText('Customer Refunds').first()).toBeVisible();
        await expect(
            page.getByText('Affiliate Accruals').first(),
        ).toBeVisible();

        const payoutCard = page
            .locator('[data-test="payout-request"]')
            .filter({ hasText: fixtures.payoutAccountName });
        await expect(payoutCard).toBeVisible();
        await expect(payoutCard).toContainText('requested');
        await shot(page, 'payables-01-overview');
    });

    test('admin marks the payout paid with a reference', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto('/admin/payouts');

        const payoutCard = page
            .locator('[data-test="payout-request"]')
            .filter({ hasText: fixtures.payoutAccountName });
        await payoutCard
            .getByRole('textbox', { name: /transfer reference/i })
            .fill('E2E-PAYOUT-REF-001');
        await payoutCard.getByRole('button', { name: 'Mark paid' }).click();

        await expect(page).toHaveURL(/admin\/payouts/);
        await expect(payoutCard).toContainText('paid');
        await expect(payoutCard).toContainText('E2E-PAYOUT-REF-001');
        await expect(
            payoutCard.getByRole('button', { name: 'Mark paid' }),
        ).toHaveCount(0);
        await shot(page, 'payables-02-payout-paid');
    });

    test('admin marks the refund processed and the customer total drops', async ({
        page,
    }) => {
        await login(page, ADMIN);
        await page.goto('/admin/payouts');

        const before = await pageProps<PayablesProps>(page);

        await page.getByRole('button', { name: /Customer Refunds/ }).click();

        // The refund row renders as a table row on lg and a card below it.
        const refundRow = page
            .locator('tr:visible, div.panel:visible')
            .filter({ hasText: fixtures.refundReason })
            .first();
        await expect(refundRow).toBeVisible();
        await shot(page, 'payables-03-pending-refund');

        await refundRow
            .getByRole('textbox', { name: /refund reference/i })
            .fill('E2E-REFUND-REF-001');
        await refundRow.getByRole('button', { name: /mark refunded/i }).click();

        await expect(page).toHaveURL(/admin\/payouts/);
        // The redirect lands back on the Sellers tab; revisit Customers.
        await page.getByRole('button', { name: /Customer Refunds/ }).click();
        await expect(page.getByText(fixtures.refundReason)).toHaveCount(0);
        await shot(page, 'payables-04-refund-processed');

        // Reload so the Inertia page object is guaranteed fresh.
        await page.reload();
        const after = await pageProps<PayablesProps>(page);
        expect(after.summary.customers.total_refunds).toBe(
            before.summary.customers.total_refunds - fixtures.refundAmount,
        );
        expect(after.summary.customers.pending_count).toBe(
            before.summary.customers.pending_count - 1,
        );
    });
});
