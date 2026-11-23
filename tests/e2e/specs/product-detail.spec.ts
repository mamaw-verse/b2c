import { expect, test } from '@playwright/test';
import { createVerifiedUser, login, shot, uniqueEmail } from '../helpers';

const BUYER = 'test@example.com';
const QURAN = '/products/quran-with-english-translation-hardcover';
const AJWA = '/products/ajwa-dates-500g-premium-grade-resealable-tub';
const SOLD_OUT = '/products/halal-certified-beef-tapa-300g-vacuum-pack';
const TRAVEL_MAT = '/products/travel-prayer-mat-with-qibla-compass-and-pouch';

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

    test('opens the variation picker and updates the selection', async ({
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

        // Option names come from the product (Grade / Weight on the seeded
        // Ajwa listing); picking a different grade swaps the weight default.
        await dialog.getByText('Standard', { exact: true }).click();
        await expect(dialog.locator('legend').first()).toContainText(
            'Standard',
        );
        await dialog.getByText('1kg', { exact: true }).click();
        await expect(dialog).toContainText('999');
        await shot(page, 'pdp-04b-variation-selected');

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
    });

    // Wave 4 (T7, qa3 1.2): the chosen variation drives the Variation row and
    // price on the page. Selectors from the source; not yet run.
    test('a variation picked in the picker updates the Variation row and price', async ({
        page,
    }) => {
        const email = uniqueEmail('pdp-variation');
        createVerifiedUser(email, 'PDP Variation E2E');
        await login(page, email);
        await page.goto(AJWA);

        const row = page.getByRole('button', { name: /^Variation:/ });
        const price = page.locator('div.rounded-panel.bg-surface-cta').first();

        // Defaults to the first in-stock variation.
        await expect(row).toContainText('Premium · 250g');
        const before = await price.innerText();
        await shot(page, 'pdp-10-variation-default');

        await row.click();
        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Select variation');
        await dialog.getByText('Standard', { exact: true }).click();
        await dialog.getByText('1kg', { exact: true }).click();
        await dialog
            .getByRole('button', { name: 'Add to cart', exact: true })
            .click();

        await expect(row).toContainText('Standard · 1kg', { timeout: 15_000 });
        await expect(price).toContainText('999');
        expect(await price.innerText()).not.toBe(before);
        await shot(page, 'pdp-11-variation-chosen');
    });

    test('sold-out variation combinations are disabled in the picker', async ({
        page,
    }) => {
        await page.goto(AJWA);
        await page.getByRole('button', { name: 'Add to cart' }).first().click();

        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Select variation');

        // Sukkari 500g is the seeded sold-out combination.
        await dialog.getByText('Sukkari', { exact: true }).click();
        await expect(dialog.getByRole('radio', { name: /500g/ })).toBeDisabled();
        await expect(dialog).toContainText('(sold out)');
        await shot(page, 'pdp-12-sold-out-variation');
    });

    test('links the shop header to the shop profile', async ({ page }) => {
        await page.goto(QURAN);

        const viewShop = page.getByRole('link', { name: 'View shop' });
        await expect(viewShop).toHaveAttribute('href', '/shops/barakah-pantry');
        // The shop name itself is a link to the profile too (qa3 task 5.1).
        await expect(
            page
                .locator('a[href="/shops/barakah-pantry"]')
                .filter({ hasText: 'Barakah' })
                .first(),
        ).toBeVisible();
        await viewShop.click();
        await expect(page).toHaveURL(/\/shops\/barakah-pantry/);
        await shot(page, 'pdp-08-shop-profile');
    });

    test('opens the report dialog for a logged-in buyer', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(QURAN);

        await page
            .getByRole('button', { name: 'Report this product', exact: true })
            .click();

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

    test('renders video slide first with controls and play thumbnail', async ({
        page,
    }) => {
        await page.goto(TRAVEL_MAT);

        const video = page.locator('video');
        await expect(video).toBeVisible();
        await expect(video).toHaveAttribute('controls', '');
        await expect(video).not.toHaveAttribute('autoplay');

        // Zoom button is not present on the video slide
        await expect(page.getByRole('button', { name: /Zoom/i })).toHaveCount(
            0,
        );

        // Thumbnail has play icon tile
        const videoThumb = page.getByRole('button', {
            name: 'Show product video',
        });
        await expect(videoThumb).toBeVisible();

        await shot(page, 'pdp-09-video-slide');
    });
});
