import { expect, test, type Page } from '@playwright/test';
import { login, shot } from '../helpers';

const SELLER = 'seller@example.com';

const voucherRow = (page: Page, code: string) =>
    page.locator('[data-test="voucher-row"]').filter({ hasText: code });

test.describe.serial('seller vouchers', () => {
    let code: string;

    test('seller sees the marketing page', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/vouchers');

        await expect(page.locator('h1')).toContainText('Marketing');
        await expect(
            page.locator('[data-test="new-voucher"]'),
        ).toBeVisible();
        await shot(page, 'sv-01-list');
    });

    test('seller creates a shop voucher', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/vouchers');

        code = `E2E${Date.now().toString(36).toUpperCase()}`;
        const form = page.locator('[data-test="new-voucher"]');
        await form.locator('summary').click();
        await form.locator('input[name="code"]').fill(code);
        await form.locator('input[name="discount_value"]').fill('50');
        await form.locator('input[name="min_spend"]').fill('300');
        await form.getByRole('button', { name: 'Create voucher' }).click();

        await expect(voucherRow(page, code)).toBeVisible({
            timeout: 15_000,
        });
        await expect(voucherRow(page, code)).toContainText('₱50 off');
        await shot(page, 'sv-02-created');
    });

    test('seller edits a shop voucher', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/vouchers');

        const row = voucherRow(page, code);
        await row.locator('summary', { hasText: 'Edit' }).click();
        await row.locator('input[name="discount_value"]').fill('75');
        await row.getByRole('button', { name: 'Save' }).click();

        await expect(voucherRow(page, code)).toContainText('₱75 off', {
            timeout: 15_000,
        });
        await shot(page, 'sv-03-updated');
    });

    test('seller deletes a shop voucher', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/vouchers');

        const row = voucherRow(page, code);
        await row.locator('summary', { hasText: 'Edit' }).click();
        await row.getByRole('button', { name: 'Delete' }).click();

        await expect(voucherRow(page, code)).toHaveCount(0, {
            timeout: 15_000,
        });
        await shot(page, 'sv-04-deleted');
    });
});
