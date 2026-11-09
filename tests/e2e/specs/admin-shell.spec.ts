import { expect, test } from '@playwright/test';
import { login, shot } from '../helpers';

const ADMIN = 'admin@example.com';
const BUYER = 'test@example.com';

test.describe('app shells', () => {
    test('admin routes render only the admin shell', async ({ page }) => {
        await login(page, ADMIN);

        for (const url of [
            '/admin/dashboard',
            '/admin/moderation',
            '/settings/profile',
        ]) {
            await page.goto(url);
            await expect(
                page.locator('main[data-shell="admin"]'),
            ).toBeVisible();
            await expect(page.locator('[data-shell="public"]')).toHaveCount(0);
        }
        await shot(page, 'admin-shell-dashboard');

        // Buyer/seller surfaces are stripped for admins — they bounce
        // back to the admin dashboard instead of switching workspaces.
        for (const url of [
            '/account',
            '/account/notifications',
            '/seller/dashboard',
        ]) {
            await page.goto(url);
            await expect(page).toHaveURL(/\/admin\/dashboard/);
        }
    });

    test('pages rendering their own shell are not wrapped twice', async ({
        page,
    }) => {
        await login(page, BUYER);

        for (const url of ['/account/chat', '/account/notifications']) {
            await page.goto(url);
            await expect(page.locator('[data-shell]')).toHaveCount(1);
            await expect(page.locator('main[data-shell="app"]')).toBeVisible();
        }
    });
});
