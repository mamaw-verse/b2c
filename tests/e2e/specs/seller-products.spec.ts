import { expect, test, type Locator, type Page } from '@playwright/test';
import { login, seedPhp, shot } from '../helpers';

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

        await videoInput.setInputFiles('fixtures/sample.mp4');

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

// ---------------------------------------------------------------------------
// Wave 4 (T6): placeholder photos, sale price validation, variant errors and
// default shipping. Selectors come from reading the source (qa3 1.1-1.3,
// qa4 A and B); not yet run against the app.
// ---------------------------------------------------------------------------

/** Form-level error summary (role="alert" with "Fix these N issues"). */
const errorSummary = (page: Page) =>
    page.locator('[role="alert"]').filter({ hasText: /Fix (this|these)/ });

/**
 * A variant matrix input by field and row index. Desktop (`-field-N`) and
 * mobile (`-m-field-N`) ids both end with `-field-N`; only one is visible.
 */
const cell = (page: Page, field: string, row: number) =>
    page.locator(`input[id$="-${field}-${row}"]:visible`).first();

async function fillBasics(page: Page, name: string): Promise<void> {
    await page.fill('input[name="name"]', name);
    await page.selectOption('select[name="category_id"]', { index: 1 });
    await page.fill('textarea[name="description"]', 'Automated e2e product.');
}

/** Enable variations and generate 2 sizes x 2 colours (4 rows). */
async function generateVariants(page: Page): Promise<Locator> {
    await page.locator('#has_variations').check();
    await page.fill('input[name="option1_name"]', 'Size');
    await page.fill('input[name="option2_name"]', 'Colour');

    const matrix = page.locator('section').filter({
        has: page.getByRole('heading', { name: 'Sales information' }),
    });
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
    await expect(page.locator('input[name*="[option1_value]"]')).toHaveCount(4);

    await matrix.getByPlaceholder('Regular price').fill('50');
    await matrix.getByPlaceholder('Stock').fill('10');
    await matrix.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.locator('input[name*="[price]"]').first()).toHaveValue(
        '50',
    );

    return matrix;
}

test.describe.serial('seller products: photos and placeholder (qa4 A)', () => {
    test('a product without photos has no thumbnail, then only the uploaded photo after editing', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        const name = `E2E Placeholder ${stamp()}`;
        await fillBasics(page, name);
        await page.fill('input[name="price"]', '120');
        await page.fill('input[name="stock"]', '5');
        await page.fill('input[name="weight"]', '0.2');
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });

        // No photo: the list shows the icon, not an image.
        await expect(productRow(page, name)).toBeVisible();
        await expect(productRow(page, name).locator('img')).toHaveCount(0);

        const slug = seedPhp<string>(
            `return \\App\\Models\\Product::where('name', '${name}')->value('slug');`,
        );
        await page.goto(`/products/${slug}`);
        await expect(page.locator('[aria-roledescription="slide"]')).toHaveCount(
            1,
        );
        await expect(
            page.locator('[aria-roledescription="slide"] img'),
        ).toHaveCount(0);
        await shot(page, 'products-11-no-photo-pdp');

        // Edit: the uploader must not receive the placeholder row.
        await page.goto('/seller/products');
        await productRow(page, name).getByRole('link', { name: 'Edit' }).click();
        await expect(page).toHaveURL(/\/edit$/);
        await expect(page.locator('[data-ds-uploader] img')).toHaveCount(0);

        await page
            .locator('[data-ds-uploader] input[type="file"]')
            .setInputFiles(PNG_1PX);
        await expect(
            page.locator(`[data-ds-uploader] li[data-name="${PNG_1PX.name}"]`),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });

        // List: real thumbnail. PDP: one slide, and it is the photo.
        await expect(
            productRow(page, name).locator('img').first(),
        ).toBeVisible();
        await page.goto(`/products/${slug}`);
        await expect(page.locator('[aria-roledescription="slide"]')).toHaveCount(
            1,
        );
        await expect(
            page.locator('[aria-roledescription="slide"] img').first(),
        ).toBeVisible();
        await shot(page, 'products-12-photo-pdp');

        // Edit again: exactly one image, no second (placeholder) tile.
        await page.goto('/seller/products');
        await productRow(page, name).getByRole('link', { name: 'Edit' }).click();
        await expect(page.locator('[data-ds-uploader] img')).toHaveCount(1);
        await expect(
            page.getByRole('button', { name: 'Remove image 2' }),
        ).toHaveCount(0);
        await shot(page, 'products-13-edit-one-photo');
    });
});

test.describe.serial('seller products: sale price validation (qa3 1.3)', () => {
    test('a sale price at or above the regular price is rejected, below is accepted', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        const name = `E2E Sale ${stamp()}`;
        await fillBasics(page, name);
        await page.fill('input[name="price"]', '100');
        await page.fill('input[name="stock"]', '5');
        await page.fill('input[name="weight"]', '0.2');

        for (const bad of ['100', '120']) {
            await page.fill('input[name="sale_price"]', bad);
            await page.getByRole('button', { name: 'Publish' }).click();
            await expect(errorSummary(page)).toContainText(/sale price/i);
            await expect(page).toHaveURL(/seller\/products\/create$/);
            await shot(page, `products-14-sale-rejected-${bad}`);
        }

        await page.fill('input[name="sale_price"]', '80');
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });
        await expect(productRow(page, name)).toBeVisible();
    });
});

test.describe.serial('seller products: variants and shipping (qa4 B)', () => {
    test('a variant sale price above its regular price shows an inline error before and after submit', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');
        await generateVariants(page);

        // Client-side check: the row is flagged before any submit.
        await cell(page, 'sale_price', 2).fill('60');
        await expect(
            page
                .getByText('The sale price must be lower than the regular price.')
                .filter({ visible: true })
                .first(),
        ).toBeVisible();
        await expect(cell(page, 'sale_price', 2)).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        await expect(cell(page, 'sale_price', 1)).not.toHaveAttribute(
            'aria-invalid',
            'true',
        );
        await shot(page, 'products-15-variant-inline-error');

        // Server rejection names the variation in the error summary.
        const name = `E2E Variant Errors ${stamp()}`;
        await fillBasics(page, name);
        await page.fill('input[name="weight"]', '0.3');
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(errorSummary(page)).toContainText(
            /Variation \d+: the sale price must be lower than the regular price/,
        );
        await expect(page).toHaveURL(/seller\/products\/create$/);
        await shot(page, 'products-16-variant-summary');

        // Fixing the value clears the inline error and the save goes through.
        await cell(page, 'sale_price', 2).fill('40');
        await expect(
            page.getByText(
                'The sale price must be lower than the regular price.',
            ),
        ).toHaveCount(0);
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });
        await expect(productRow(page, name)).toBeVisible();
    });

    test('default shipping stays visible with variants; empty weight errors; overrides round-trip', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        await expect(
            page.getByRole('heading', { name: 'Shipping', exact: true }),
        ).toBeVisible();
        await generateVariants(page);

        await expect(
            page.getByRole('heading', { name: 'Default shipping' }),
        ).toBeVisible();
        await expect(page.locator('input[name="weight"]')).toBeVisible();
        await expect(
            page.getByText(/Applies to every variation unless you set its own/),
        ).toBeVisible();

        // Empty default weight: the save fails visibly, not silently.
        const name = `E2E Variant Shipping ${stamp()}`;
        await fillBasics(page, name);
        await page.getByRole('button', { name: 'Save draft' }).click();
        await expect(errorSummary(page)).toContainText(
            /Enter the default weight in kg/,
        );
        await expect(
            page.getByText(/Enter the default weight in kg/).last(),
        ).toBeVisible();
        await expect(page).toHaveURL(/seller\/products\/create$/);
        await shot(page, 'products-17-default-weight-error');

        // The default shows as the placeholder of every variant weight.
        await page.fill('input[name="weight"]', '0.5');
        await expect(cell(page, 'weight', 0)).toHaveAttribute(
            'placeholder',
            '0.5',
        );
        await cell(page, 'weight', 1).fill('1.2');
        await page.getByRole('button', { name: 'Save draft' }).click();
        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });

        // One override and the default come back on edit.
        await productRow(page, name).getByRole('link', { name: 'Edit' }).click();
        await expect(page).toHaveURL(/\/edit$/);
        await expect(page.locator('input[name="weight"]')).toHaveValue('0.5');

        const weights: string[] = [];
        for (let row = 0; row < 4; row++) {
            weights.push(await cell(page, 'weight', row).inputValue());
        }
        expect(weights.filter((w) => w === '1.2')).toHaveLength(1);
        expect(weights.filter((w) => w === '')).toHaveLength(3);
        await shot(page, 'products-18-variant-shipping-edit');
    });
});
