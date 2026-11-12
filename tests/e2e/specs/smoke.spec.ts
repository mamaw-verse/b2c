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

    test('home page shows the audience benefits section', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.getByRole('heading', {
                name: 'Why Choose Our Marketplace?',
            }),
        ).toBeVisible();
        for (const audience of [
            'For Buyers',
            'For Sellers',
            'For Certification Applicants',
            'For Businesses',
        ]) {
            await expect(
                page.getByText(audience, { exact: true }),
            ).toBeVisible();
        }
        await shot(page, '01b-home-benefits');
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

test.describe('content pages', () => {
    test('a published content page renders', async ({ page }) => {
        const response = await page.goto('/pages/returns');

        expect(response?.status()).toBe(200);
        await expect(page.locator('h1')).toContainText('Returns');
        await shot(page, 'smoke-content-01');
    });

    test('an unknown content page returns 404', async ({ page }) => {
        const response = await page.goto('/pages/nonexistent');

        expect(response?.status()).toBe(404);
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
        await expect(page).toHaveURL(/account|email\/verify/, {
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
