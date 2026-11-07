import { expect, test } from '@playwright/test';
import { shot, uniqueEmail } from '../helpers';

const PASSWORD = 'E2e-password-123!';

test.describe('public pages', () => {
    test('home page renders', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/.+/);
        await expect(page.locator('body')).toBeVisible();
        await shot(page, '01-home');
    });

    test('login page renders the form', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await shot(page, '02-login-form');
    });

    test('register page renders the form', async ({ page }) => {
        await page.goto('/register');
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await shot(page, '03-register-form');
    });
});

test.describe('auth journey', () => {
    test('a visitor can register and reaches a post-auth page', async ({
        page,
    }) => {
        const email = uniqueEmail();

        await page.goto('/register');
        await page.fill('input[name="name"]', 'E2E Bot');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', PASSWORD);
        await page.fill('input[name="password_confirmation"]', PASSWORD);
        await shot(page, '10-register-filled');

        await page.click('[data-test="register-user-button"]');
        // Verified middleware may send fresh accounts to /email/verify instead.
        await expect(page).toHaveURL(/dashboard|email\/verify/, {
            timeout: 15_000,
        });
        await shot(page, '11-after-register');
    });

    test('login rejects bad credentials with a validation error', async ({
        page,
    }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail('missing'));
        await page.fill('input[name="password"]', 'wrong-password');
        await page.click('[data-test="login-button"]');
        await expect(page).toHaveURL(/login/);
        await shot(page, '20-login-failed');
    });
});
