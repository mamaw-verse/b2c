import { expect, test } from '@playwright/test';
import {
    awaitHumanCheck,
    createVerifiedUser,
    login,
    pageProps,
    seedPhp,
    shot,
    uniqueEmail,
} from '../helpers';

const GOOGLE_ONLY_PASSWORD = 'any-password-123';

/** Seed a verified account that signed up through Google (no password). */
function seedGoogleOnlyUser(email: string): void {
    seedPhp(`
        $user = new \\App\\Models\\User();
        $user->forceFill([
            'name' => 'E2E Google Only',
            'email' => '${email}',
            'password' => null,
            'google_id' => 'e2e-google-' . uniqid(),
            'email_verified_at' => now(),
        ])->save();
        return ['id' => $user->id];
    `);
}

/** Seed a verified account that has both a password and a linked Google id. */
function seedLinkedUser(email: string): void {
    seedPhp(`
        $user = new \\App\\Models\\User();
        $user->forceFill([
            'name' => 'E2E Google Linked',
            'email' => '${email}',
            'password' => bcrypt('password'),
            'google_id' => 'e2e-google-' . uniqid(),
            'email_verified_at' => now(),
        ])->save();
        return ['id' => $user->id];
    `);
}

test.describe('google sign-in', () => {
    test('login and register offer Google sign-in', async ({ page }) => {
        await page.goto('/login');
        const loginButton = page.locator('[data-test="google-auth-button"]');
        await expect(loginButton).toBeVisible();
        await expect(loginButton).toContainText('Continue with Google');
        await expect(loginButton).toHaveAttribute('href', '/auth/google');
        await shot(page, 'google-01-login');

        await page.goto('/register');
        const registerButton = page.locator('[data-test="google-auth-button"]');
        await expect(registerButton).toBeVisible();
        await expect(registerButton).toContainText('Sign up with Google');
        await expect(registerButton).toHaveAttribute('href', '/auth/google');
        await shot(page, 'google-02-register');
    });

    test('the Google entry point redirects to Google OAuth', async ({
        page,
    }) => {
        // Do not follow the redirect: no real Google account is exercised.
        const response = await page.request.get('/auth/google', {
            maxRedirects: 0,
        });

        expect([301, 302, 303, 307]).toContain(response.status());
        expect(response.headers()['location']).toMatch(
            /^https:\/\/accounts\.google\.com\//,
        );
    });

    test('a failed Google callback returns to login with an error', async ({
        page,
    }) => {
        // No OAuth state in the session, so Socialite rejects the callback.
        await page.goto('/auth/google/callback?state=invalid&code=invalid');

        await expect(page).toHaveURL(/\/login/);
        await expect(
            page.getByText('We could not sign you in with Google'),
        ).toBeVisible();
        await shot(page, 'google-03-callback-failed');
    });

    test('a Google-only account cannot sign in with a password', async ({
        page,
    }) => {
        const email = uniqueEmail('google-only');
        seedGoogleOnlyUser(email);

        await page.goto('/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', GOOGLE_ONLY_PASSWORD);
        await awaitHumanCheck(page);
        await page.click('[data-test="login-button"]');

        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await shot(page, 'google-04-password-rejected');
    });

    test('confirm-password offers Google only to linked accounts', async ({
        page,
    }) => {
        const linked = uniqueEmail('google-linked');
        seedLinkedUser(linked);
        await login(page, linked);

        await page.goto('/user/confirm-password');
        const googleButton = page.locator('[data-test="google-auth-button"]');
        await expect(googleButton).toContainText('Confirm with Google');
        await expect(googleButton).toHaveAttribute(
            'href',
            '/auth/google/confirm',
        );
        await shot(page, 'google-05-confirm-linked');
    });

    test('confirm-password hides Google for accounts without a Google identity', async ({
        page,
    }) => {
        const plain = uniqueEmail('google-none');
        createVerifiedUser(plain);
        await login(page, plain);

        await page.goto('/user/confirm-password');
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(
            page.locator('[data-test="google-auth-button"]'),
        ).toHaveCount(0);
        await shot(page, 'google-06-confirm-plain');
    });
});

test.describe('turnstile human check', () => {
    for (const path of ['/login', '/register', '/forgot-password']) {
        test(`${path} shows the widget field only when the check is enabled`, async ({
            page,
        }) => {
            await page.goto(path);
            const props = await pageProps<{ turnstileSiteKey: string | null }>(
                page,
            );
            const field = page.locator('input[name="cf-turnstile-response"]');

            if (props.turnstileSiteKey) {
                await expect(field).toBeAttached();
                await awaitHumanCheck(page);
                await expect(field).not.toHaveValue('');
            } else {
                await expect(field).toHaveCount(0);
            }

            await shot(
                page,
                `turnstile-01-${path.replace('/', '').replace('-', '')}`,
            );
        });
    }

    test('login without a token is rejected', async ({ page }) => {
        await page.goto('/login');
        const props = await pageProps<{ turnstileSiteKey: string | null }>(
            page,
        );
        test.skip(
            !props.turnstileSiteKey,
            'Human check is disabled in this environment',
        );

        await page.fill('input[name="email"]', uniqueEmail('no-token'));
        await page.fill('input[name="password"]', 'wrong-password');
        await awaitHumanCheck(page);
        // Drop the token the way an automated client without a widget would.
        await page.evaluate(() => {
            const input = document.querySelector<HTMLInputElement>(
                'input[name="cf-turnstile-response"]',
            );
            if (input) {
                input.value = '';
            }
        });
        await page.click('[data-test="login-button"]');

        await expect(page).toHaveURL(/\/login/);
        await expect(
            page.getByText(/CAPTCHA validation failed/i),
        ).toBeVisible();
        await shot(page, 'turnstile-02-login-no-token');
    });

    test('forgot-password without a token is rejected', async ({ page }) => {
        await page.goto('/forgot-password');
        const props = await pageProps<{ turnstileSiteKey: string | null }>(
            page,
        );
        test.skip(
            !props.turnstileSiteKey,
            'Human check is disabled in this environment',
        );

        await page.fill('input[name="email"]', uniqueEmail('no-token'));
        await awaitHumanCheck(page);
        await page.evaluate(() => {
            const input = document.querySelector<HTMLInputElement>(
                'input[name="cf-turnstile-response"]',
            );
            if (input) {
                input.value = '';
            }
        });
        await page.click('[data-test="email-password-reset-link-button"]');

        await expect(
            page.getByText(/CAPTCHA validation failed/i),
        ).toBeVisible();
        await shot(page, 'turnstile-03-forgot-no-token');
    });
});

test.describe('google analytics', () => {
    const gtag = /googletagmanager\.com\/gtag\/js/;

    test('gtag is never injected on auth pages', async ({ page }) => {
        for (const path of ['/login', '/register', '/forgot-password']) {
            const response = await page.request.get(path);
            expect(response.status()).toBe(200);
            expect(await response.text()).not.toMatch(gtag);
        }
    });

    test('gtag appears on public pages only when GA4 is configured', async ({
        page,
    }) => {
        const home = await (await page.request.get('/')).text();
        test.skip(
            !gtag.test(home),
            'GOOGLE_ANALYTICS_ID is not set in this environment',
        );

        const sellers = await (await page.request.get('/sellers')).text();
        expect(sellers).toMatch(gtag);
        expect(home).toMatch(/gtag\('config'/);
    });
});
