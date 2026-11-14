import { expect, test, type Page } from '@playwright/test';
import { login, shot } from '../helpers';

const SELLER = 'seller@example.com';

const PNG_1PX = {
    name: 'e2e-photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
    ),
};

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

        // Approved shops get an outlined "View shop" button that opens the
        // storefront in a new tab (qa3 task 6.1).
        const viewShop = page.getByRole('link', { name: /View shop/ });
        await expect(viewShop).toHaveAttribute('href', '/shops/barakah-pantry');
        await expect(viewShop).toHaveAttribute('target', '_blank');
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
        await expect(page.getByText('Halal information')).toHaveCount(0);
        await page.fill('input[name="price"]', '199');
        await page.fill('input[name="sale_price"]', '150');
        await page.fill('input[name="stock"]', '15');
        await page.fill('input[name="weight"]', '0.4');

        // Product photos upload through the multi-file picker (qa3 task 1.1).
        await page
            .locator('[data-ds-uploader] input[type="file"]')
            .setInputFiles(PNG_1PX);
        await expect(
            page.locator(`[data-ds-uploader] li[data-name="${PNG_1PX.name}"]`),
        ).toBeVisible();
        await shot(page, 'products-02-create-form');

        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, {
            timeout: 15_000,
        });
        await expect(productRow(page, simpleName)).toBeVisible();
        // The uploaded photo becomes the row thumbnail (qa3 task 1.1).
        await expect(
            productRow(page, simpleName).locator('img').first(),
        ).toBeVisible();
        await shot(page, 'products-03-created');
    });

    test('seller generates variations and applies values to all', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        await page.locator('#has_variations').check();

        // Option names are posted so the PDP picker can label its chips
        // (qa3 task 1.2).
        await page.fill('input[name="option1_name"]', 'Size');
        await page.fill('input[name="option2_name"]', 'Colour');

        const matrix = page.locator('section').filter({
            has: page.getByRole('heading', {
                name: 'Sales information',
            }),
        });
        await expect(
            matrix.getByText('Add at least one value to generate variations.'),
        ).toBeVisible();

        const optionAdd = matrix.getByRole('button', {
            name: 'Add',
            exact: true,
        });
        const addValue = async (option: number, value: string) => {
            await optionAdd.nth(option).click();
            const input = page.getByPlaceholder('New value');
            await input.fill(value);
            await input
                .locator('xpath=..')
                .getByRole('button', { name: 'Add' })
                .click();
        };

        await addValue(0, 'S');
        await addValue(0, 'M');
        await addValue(1, 'Red');
        await addValue(1, 'Blue');

        // 2 sizes × 2 colours = 4 generated rows.
        const rowInputs = page.locator('input[name*="[option1_value]"]');
        await expect(rowInputs).toHaveCount(4);
        await shot(page, 'products-04-variations');

        // Apply to all fills every row; decimal prices are preserved and a
        // sale price below the regular price is stored as was_price
        // (qa3 task 1.3).
        await matrix.getByPlaceholder('Regular price').fill('49.50');
        await matrix.getByPlaceholder('Sale price (opt)').fill('45');
        await matrix.getByPlaceholder('Stock').fill('100');
        await matrix
            .getByRole('button', { name: 'Apply', exact: true })
            .click();

        const prices = page.locator('input[name*="[price]"]');
        const salePrices = page.locator('input[name*="[sale_price]"]');
        await expect(prices).toHaveCount(4);
        await expect(salePrices).toHaveCount(4);
        for (let i = 0; i < 4; i++) {
            await expect(prices.nth(i)).toHaveValue('49.5');
            await expect(salePrices.nth(i)).toHaveValue('45');
        }
        await expect(
            page.locator('input[name*="[stock]"]').first(),
        ).toHaveValue('100');
        await shot(page, 'products-04-apply-all');

        // Removing an option value drops its rows but keeps the rest.
        await page.getByRole('button', { name: 'Remove M' }).click();
        await expect(rowInputs).toHaveCount(2);
        await expect(prices.first()).toHaveValue('49.5');

        const variationName = `E2E Variations ${stamp()}`;
        await page.fill('input[name="name"]', variationName);
        await page.selectOption('select[name="category_id"]', { index: 1 });
        await page.fill(
            'textarea[name="description"]',
            'Automated e2e variations product.',
        );
        await page.fill('input[name="weight"]', '0.3');
        await shot(page, 'products-05-variation-form');

        await page.getByRole('button', { name: 'Save draft' }).click();
        await expect(page).toHaveURL(/seller\/products$/, {
            timeout: 15_000,
        });
        await expect(productRow(page, variationName)).toBeVisible();
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

        // The uploaded photo and the regular/sale price mapping round-trip
        // through the edit form (qa3 tasks 1.1 and 1.3).
        await expect(
            page.locator('[data-ds-uploader] img').first(),
        ).toBeVisible();
        await expect(page.locator('input[name="price"]')).toHaveValue('199');
        await expect(page.locator('input[name="sale_price"]')).toHaveValue(
            '150',
        );
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

    test('seller uploads, previews, and removes product video', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        const videoInput = page.locator(
            '[data-ds-video-uploader] input[type="file"]',
        );
        await expect(videoInput).toBeAttached();

        await videoInput.setInputFiles('tests/e2e/fixtures/sample.mp4');

        await expect(
            page.locator('[data-ds-video-uploader] video'),
        ).toBeVisible();
        await shot(page, 'products-09-video-uploaded');

        await page
            .getByRole('button', { name: 'Remove product video' })
            .click();
        await expect(
            page.locator('[data-ds-video-uploader] video'),
        ).toHaveCount(0);
        await shot(page, 'products-10-video-removed');
    });
});
