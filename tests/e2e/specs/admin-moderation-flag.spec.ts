import { expect, test, type Page } from '@playwright/test';
import { login, seedProductWithVideo, shot } from '../helpers';

const ADMIN = 'admin@example.com';
const BUYER = 'test@example.com';

const stamp = () =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The detail pane keeps secondary actions behind "More actions" on narrow
 * containers; the inline Hide button only renders at @3xl widths.
 */
async function clickHide(page: Page): Promise<void> {
    const inline = page.getByRole('button', { name: 'Hide', exact: true });
    if (await inline.isVisible()) {
        await inline.click();
        return;
    }
    await page.getByRole('button', { name: 'More actions' }).click();
    // The popover renders under the sticky bottom nav / scroll pane on narrow
    // layouts, so Playwright's hit-target check can't click it; dispatch the
    // click directly — React still runs the real onClick handler.
    await page
        .getByRole('menuitem', { name: 'Hide' })
        .evaluate((el) => (el as HTMLElement).click());
}

test.describe.serial('admin moderation — manual product flag', () => {
    let productName: string;
    let productPath: string;

    test('admin flags a product with a video and hides it; buyers get 404', async ({
        page,
    }) => {
        productName = `E2E Flagged Video ${stamp()}`;
        const slug = `e2e-flag-video-${stamp()}`;
        productPath = `/products/${slug}`;
        seedProductWithVideo(productName, slug);

        // Buyer sees the listing live, with the video slide first.
        await page.goto(productPath);
        await expect(
            page.getByRole('heading', { level: 1, name: productName }),
        ).toBeVisible();
        await expect(page.locator('video')).toBeVisible();
        await shot(page, 'mod-flag-01-buyer-pdp');

        // Admin opens the queue and flags the product through the dialog.
        await login(page, ADMIN);
        await page.goto('/admin/moderation');
        await page.getByRole('button', { name: 'Flag a product' }).click();

        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Flag product for moderation');
        await dialog
            .getByPlaceholder(/Search by product name/)
            .fill(productName);
        await dialog
            .getByRole('button', { name: new RegExp(productName) })
            .click();
        await dialog.locator('#flag-reason-select').selectOption('other');
        await dialog
            .locator('#flag-note-textarea')
            .fill('E2E flag: video content under review.');
        await shot(page, 'mod-flag-02-flag-dialog');
        await dialog.getByRole('button', { name: 'Flag product' }).click();

        // The flag redirects to the queue item detail page.
        await expect(page).toHaveURL(/admin\/moderation\/.+/, {
            timeout: 15_000,
        });
        await expect(page.getByText('Admin flag').first()).toBeVisible();
        // Detail pane shows the flag note, photos and the product video.
        await expect(
            page.getByText('E2E flag: video content under review.').first(),
        ).toBeVisible();
        await expect(page.locator('video').first()).toBeVisible();
        await shot(page, 'mod-flag-03-queue-item');

        // Hide the item; the product is unpublished for buyers.
        await clickHide(page);
        const confirm = page.getByRole('dialog');
        await expect(confirm).toContainText('Hide content');
        await shot(page, 'mod-flag-04-hide-confirm');
        await confirm.getByRole('button', { name: 'Hide' }).click();

        await expect(page).toHaveURL(/admin\/moderation$/, {
            timeout: 15_000,
        });
        await shot(page, 'mod-flag-05-hidden');

        // Buyers now get a 404 on the product page.
        const response = await page.goto(productPath);
        expect(response?.status()).toBe(404);
        await shot(page, 'mod-flag-06-buyer-404');
    });

    test('buyer session also gets 404 on the hidden product', async ({
        page,
    }) => {
        await login(page, BUYER);
        const response = await page.goto(productPath);
        expect(response?.status()).toBe(404);
        await shot(page, 'mod-flag-07-buyer-404-logged-in');
    });
});
