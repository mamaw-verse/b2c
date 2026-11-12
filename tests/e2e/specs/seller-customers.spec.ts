import { expect, test } from '@playwright/test';
import { login, shot } from '../helpers';

const SELLER = 'seller@example.com';

test.describe('seller customers', () => {
    test('seller browses customers and opens a customer detail page', async ({
        page,
    }) => {
        await login(page, SELLER);

        await page.goto('/seller/customers');
        await expect(
            page.getByRole('heading', { name: 'Customers', exact: true }),
        ).toBeVisible();
        const firstCustomer = page
            .locator('[data-test="customer-row"]')
            .first();
        await expect(firstCustomer).toBeVisible();
        await shot(page, 'customers-01-list');

        await firstCustomer.locator('a').first().click();
        await expect(page).toHaveURL(/\/seller\/customers\/.+/);
        await expect(page.locator('h1')).toBeVisible();
        await expect(
            page.getByText('Order History', { exact: true }),
        ).toBeVisible();
        await shot(page, 'customers-02-detail');
    });
});
