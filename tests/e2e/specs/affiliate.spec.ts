import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createVerifiedUser, login, shot, uniqueEmail } from '../helpers';

const SELLER = 'seller@example.com';
const BUYER = 'test@example.com';
const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

const PNG_1PX = {
    name: 'e2e-photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
    ),
};

test.describe.serial('affiliate program', () => {
    const productName = `E2E Affiliate ${Date.now()}`;
    const staffEmail = uniqueEmail('staff-aff');

    test.beforeAll(() => {
        // Create verified staff user and assign as active staff to the seller's shop
        createVerifiedUser(staffEmail, 'Affiliate Staff');
        execSync(
            `vendor/bin/sail artisan tinker --execute 'App\\Models\\ShopStaff::factory()->active()->create(["shop_id" => App\\Models\\User::where("email", "${SELLER}")->first()->shop->id, "user_id" => App\\Models\\User::where("email", "${staffEmail}")->first()->id, "email" => "${staffEmail}"]);'`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
    });

    test.afterAll(() => {
        execSync(
            `vendor/bin/sail artisan tinker --execute 'App\\Models\\ShopStaff::where("email", "${staffEmail}")->delete();'`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
    });

    test('seller creates a product with 5% affiliate enabled and views live breakdown', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/products/create');

        await page.fill('input[name="name"]', productName);
        await page.selectOption('select[name="category_id"]', { index: 1 });
        await page.fill(
            'textarea[name="description"]',
            'E2E affiliate product description.',
        );
        await page.fill('input[name="price"]', '1000');
        await page.fill('input[name="stock"]', '20');
        await page.fill('input[name="weight"]', '0.5');

        await page
            .locator('[data-ds-uploader] input[type="file"]')
            .setInputFiles(PNG_1PX);

        // Affiliate panel
        const affiliateSection = page
            .locator('section')
            .filter({ hasText: 'Affiliate program' });
        await expect(affiliateSection).toBeVisible();

        // Turn on affiliate toggle
        const toggle = affiliateSection
            .locator('button[role="switch"], input[type="checkbox"]')
            .first();
        await toggle.click();

        // Set commission percent to 5
        const commissionInput = affiliateSection.locator(
            'input[type="number"]',
        );
        await expect(commissionInput).toBeVisible();
        await commissionInput.fill('5');

        // Check live breakdown
        await expect(affiliateSection).toContainText('₱50');

        await shot(page, 'affiliate-01-product-form');

        // Submit form
        await page.getByRole('button', { name: 'Publish' }).click();

        await expect(page).toHaveURL(/seller\/products$/, { timeout: 15_000 });

        // Find the created product row
        const row = page
            .locator('tr, li')
            .filter({ hasText: productName })
            .filter({ visible: true })
            .first();
        await expect(row).toBeVisible();
        await expect(row).toContainText(/Affiliate 5%/i);

        await shot(page, 'affiliate-02-product-badge');
    });

    test('seller bulk toggles affiliate on product list', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/products');

        const row = page
            .locator('tr, li')
            .filter({ hasText: productName })
            .filter({ visible: true })
            .first();
        await expect(row).toBeVisible();

        // Select the product
        const checkbox = row.locator('input[type="checkbox"]');
        await checkbox.check();

        // Bulk bar appears
        const bulkBar = page.locator('[data-ds-bulk-bar]');
        await expect(bulkBar).toBeVisible();

        // Click Disable affiliate
        await bulkBar
            .getByRole('button', { name: /Disable affiliate/i })
            .click();

        // Row no longer shows Affiliate 5% badge
        await page.waitForTimeout(1000);
        await expect(row).not.toContainText(/Affiliate 5%/i);

        await shot(page, 'affiliate-03-bulk-disabled');
    });

    test('buyer activates affiliate profile and views promotable products', async ({
        page,
    }) => {
        await login(page, BUYER);
        await page.goto('/account/affiliate');

        await expect(page.locator('h1')).toContainText('Affiliate Program');

        // If not activated yet, activate it
        const activateButton = page.getByRole('button', {
            name: /Activate Affiliate Account/i,
        });
        if (await activateButton.isVisible()) {
            await activateButton.click();
            await page.waitForURL(/\/account\/affiliate$/);
        }

        await expect(page.locator('body')).toContainText(
            /Referral code|Total earned/i,
        );
        await shot(page, 'affiliate-04-account-affiliate');
    });

    test('staff user cannot see affiliate panel on product form', async ({
        page,
    }) => {
        await login(page, staffEmail);
        await page.goto('/seller/products/create');

        // Wait for page to load
        await expect(page.locator('input[name="name"]')).toBeVisible();

        // Affiliate program panel should not be present for staff
        const affiliateSection = page
            .locator('section')
            .filter({ hasText: 'Affiliate program' });
        await expect(affiliateSection).toHaveCount(0);

        await shot(page, 'affiliate-05-staff-no-affiliate');
    });
});
