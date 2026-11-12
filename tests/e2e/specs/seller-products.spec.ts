import { expect, test, type Page } from '@playwright/test';
import { login, shot } from '../helpers';

const SELLER = 'seller@example.com';

const stamp = () =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Match a product row on the desktop table or the mobile card list. */
const productRow = (page: Page, text: string) =>
    page
        .locator('[data-ds-bulk] tr, [data-ds-bulk] li')
        .filter({ hasText: text })
        .filter({ visible: true })
        .first();

test.describe.serial('seller products', () => {
    let simpleName: string;
    let updatedName: string;

    test('seller sees the product list', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');

        await expect(
            page.getByRole('link', { name: /Add product/i }),
        ).toBeVisible();
        await expect(page.locator('table caption')).toContainText('products');
        await expect(page.getByPlaceholder(/Search products/i)).toBeVisible();
        await shot(page, 'products-01-list');
    });

    test('seller creates a simple published product', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');
        await page.getByRole('link', { name: /Add product/i }).click();
        await expect(page).toHaveURL(/seller\/products\/create$/);

        simpleName = `E2E Simple ${stamp()}`;
        await page.fill('input[name="name"]', simpleName);
        await page.selectOption('select[name="category_id"]', { index: 1 });
        await page.fill(
            'textarea[name="description"]',
            'Automated e2e simple product.',
        );
        await page
            .locator('input[name="halal_status"][value="not_ingestible"]')
            .check();
        await page.fill('input[name="price"]', '199');
        await page.fill('input[name="stock"]', '15');
        await page.fill('input[name="weight"]', '0.4');
        await shot(page, 'products-02-create-form');

        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, {
            timeout: 15_000,
        });
        await expect(productRow(page, simpleName)).toBeVisible();
        await shot(page, 'products-03-created');
    });

    test('seller sees halal certificate fields when certified', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        await page
            .locator('input[name="halal_status"][value="certified"]')
            .check();
        await expect(
            page.locator('select[name="certifying_body"]'),
        ).toBeVisible();
        await expect(
            page.locator('input[name="certificate_number"]'),
        ).toBeVisible();
        await expect(page.locator('input[name="valid_until"]')).toBeVisible();
        await expect(
            page.locator('textarea[name="ingredients"]'),
        ).toBeVisible();
        await expect(
            page.locator('input[name="no_pork_alcohol_declared"]'),
        ).toBeVisible();

        await page.fill('input[name="name"]', `E2E Certified ${stamp()}`);
        await page.selectOption('select[name="category_id"]', { index: 1 });
        await page.fill(
            'textarea[name="description"]',
            'Automated e2e certified product.',
        );
        await page.selectOption('select[name="certifying_body"]', {
            index: 1,
        });
        await page.fill('input[name="certificate_number"]', 'CERT-E2E-001');
        await page.fill('input[name="valid_until"]', '2027-12-31');
        await page.fill('textarea[name="ingredients"]', 'Dates, water.');
        await page.check('input[name="no_pork_alcohol_declared"]');
        await page.fill('input[name="price"]', '250');
        await page.fill('input[name="stock"]', '12');
        await page.fill('input[name="weight"]', '0.5');
        await shot(page, 'products-04-halal-fields');

        await page.getByRole('button', { name: 'Save draft' }).click();
        await expect(page).toHaveURL(/seller\/products$/, {
            timeout: 15_000,
        });
    });

    test('seller filters the product list by name', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');

        await page.getByPlaceholder(/Search products/i).fill(simpleName);
        await page.getByPlaceholder(/Search products/i).press('Enter');

        await expect(page).toHaveURL(/search=/);
        await expect(productRow(page, simpleName)).toBeVisible();
        await shot(page, 'products-05-filtered');
    });

    test('seller edits a product and saves it as a draft', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');
        await page.getByPlaceholder(/Search products/i).fill(simpleName);
        await page.getByPlaceholder(/Search products/i).press('Enter');
        await expect(page).toHaveURL(/search=/);

        await page.getByRole('link', { name: 'Edit' }).first().click();
        await expect(page).toHaveURL(/\/edit$/);
        await shot(page, 'products-06-edit');

        updatedName = `${simpleName} updated`;
        await page.fill('input[name="name"]', updatedName);
        await page.getByRole('button', { name: 'Save draft' }).click();
        await expect(page).toHaveURL(/seller\/products$/, {
            timeout: 15_000,
        });

        const row = productRow(page, updatedName);
        await expect(row).toBeVisible();
        await expect(row).toContainText('Draft');
        await shot(page, 'products-07-updated');
    });

    test('seller deletes a product', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');

        const row = productRow(page, updatedName);
        await expect(row).toBeVisible();

        page.once('dialog', (dialog) => dialog.accept());
        await row.getByRole('button', { name: 'Delete' }).click();

        await expect(productRow(page, updatedName)).toHaveCount(0, {
            timeout: 15_000,
        });
        await shot(page, 'products-08-deleted');
    });
});
