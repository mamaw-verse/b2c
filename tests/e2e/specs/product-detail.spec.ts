import { expect, test } from '@playwright/test';
import { login, shot } from '../helpers';

const BUYER = 'test@example.com';
const QURAN = '/products/quran-with-english-translation-hardcover';
const AJWA = '/products/ajwa-dates-500g-premium-grade-resealable-tub';
const SOLD_OUT = '/products/halal-certified-beef-tapa-300g-vacuum-pack';

test.describe('product detail', () => {
    test('renders the detail page with price and reviews', async ({ page }) => {
        await page.goto(QURAN);

        await expect(
            page.getByRole('heading', { level: 1, name: /Qur/ }),
        ).toBeVisible();
        await expect(
            page.locator('div.rounded-panel.bg-surface-cta').first(),
        ).toBeVisible();
        await shot(page, 'pdp-01-detail');

        await expect(page.locator('#pd-rev')).toBeVisible();
        await shot(page, 'pdp-02-reviews');
    });

    test('shows halal badge and validity without the certifier', async ({
        page,
    }) => {
        await page.goto(AJWA);

        const facts = page.locator('ul[aria-label="Halal summary"]');
        await expect(facts).toBeVisible();
        await expect(facts).toContainText('Valid to');
        await expect(page.getByText(/Certified by/)).toHaveCount(0);
        await shot(page, 'pdp-03-halal');
    });

    test('opens the variation picker for a product with variants', async ({
        page,
    }) => {
        await page.goto(AJWA);

        await page.getByRole('button', { name: 'Add to cart' }).first().click();

        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Select variation');
        await expect(
            dialog.locator('input[type="radio"]').first(),
        ).toBeVisible();
        await shot(page, 'pdp-04-variation-picker');

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
    });

    test('opens the report dialog for a logged-in buyer', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(QURAN);

        await page.getByRole('button', { name: 'Report', exact: true }).click();

        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText(
            'Why are you reporting this listing?',
        );
        await expect(
            dialog.locator('input[name="report-reason"]').first(),
        ).toBeVisible();
        await shot(page, 'pdp-05-report-dialog');

        await dialog.getByRole('button', { name: 'Close' }).click();
        await expect(dialog).toHaveCount(0);
    });

    test('redirects anonymous visitors to login when chatting', async ({
        page,
    }) => {
        await page.goto(QURAN);

        await page
            .locator('button:visible')
            .filter({ hasText: 'Chat' })
            .first()
            .click();

        await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
        await shot(page, 'pdp-06-chat-login-redirect');
    });

    test('shows the sold-out state for an out-of-stock product', async ({
        page,
    }) => {
        await page.goto(SOLD_OUT);

        const buy = page.getByRole('button', { name: 'Out of stock' });
        await expect(buy).toBeVisible();
        await expect(buy).toBeDisabled();
        await shot(page, 'pdp-07-sold-out');
    });
});
