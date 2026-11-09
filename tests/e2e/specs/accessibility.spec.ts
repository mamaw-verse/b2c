import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { login, shot } from '../helpers';

const surfaces = [
    {
        role: 'public',
        email: null,
        paths: [
            '/',
            '/login',
            '/register',
            '/seller/terms',
            '/categories/halal-food',
            '/products/quran-with-english-translation-hardcover',
        ],
    },
    {
        role: 'buyer',
        email: 'test@example.com',
        paths: [
            '/account',
            '/account/orders',
            '/account/addresses',
            '/account/chat',
            '/account/notifications',
            '/cart',
        ],
    },
    {
        role: 'seller',
        email: 'seller@example.com',
        paths: [
            '/seller/dashboard',
            '/seller/products',
            '/seller/orders',
            '/seller/settings',
            '/seller/chat',
            '/seller/notifications',
            '/seller/finance',
            '/seller/customers',
            '/seller/vouchers',
        ],
    },
    {
        role: 'admin',
        email: 'admin@example.com',
        paths: [
            '/admin/dashboard',
            '/admin/moderation',
            '/settings/profile',
            '/admin/users',
            '/admin/categories',
            '/admin/vouchers',
            '/admin/payouts',
            '/admin/audit-log',
            '/admin/settings',
        ],
    },
];

for (const surface of surfaces) {
    test(`${surface.role} pages meet WCAG AA in light and dark`, async ({
        page,
    }) => {
        test.setTimeout(120_000);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        if (surface.email) await login(page, surface.email);

        for (const [index, path] of surface.paths.entries()) {
            const response = await page.goto(path);
            expect(response?.status(), path).toBe(200);
            await page.locator('main').waitFor();
            await shot(page, `a11y-${surface.role}-${index}`);

            for (const mode of ['light', 'dark']) {
                // The server reads the appearance cookie for the initial
                // render; localStorage alone would flash light, then React
                // flips .dark mid-scan and axe sees transition colors.
                await page.evaluate((appearance) => {
                    localStorage.setItem('appearance', appearance);
                    document.cookie = `appearance=${appearance}; path=/; max-age=31536000`;
                }, mode);
                await page.reload();
                await page.locator('main').waitFor();
                await page.waitForFunction(
                    (expected) =>
                        getComputedStyle(document.documentElement)
                            .getPropertyValue('--foreground')
                            .trim() === expected,
                    mode === 'dark' ? '#e8f2eb' : '#202923',
                );
                await page.evaluate(() => document.fonts.ready);
                const result = await new AxeBuilder({ page })
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                    .analyze();
                await test
                    .info()
                    .attach(`${surface.role}-${index}-${mode}-axe`, {
                        body: JSON.stringify(
                            {
                                path,
                                mode,
                                violations: result.violations,
                                incomplete: result.incomplete,
                            },
                            null,
                            2,
                        ),
                        contentType: 'application/json',
                    });
                expect.soft(result.violations, `${path} (${mode})`).toEqual([]);
            }
        }
    });
}
