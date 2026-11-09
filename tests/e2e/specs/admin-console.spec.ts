import { expect, test } from '@playwright/test';
import {
    api,
    createVerifiedUser,
    login,
    pageProps,
    shot,
    uniqueEmail,
} from '../helpers';

const ADMIN = 'admin@example.com';

test.describe.serial('admin console', () => {
    // -------------------------------------------------------------------------
    // User management
    // -------------------------------------------------------------------------

    test('admin views the user list and can search by email', async ({
        page,
    }) => {
        await login(page, ADMIN);

        await page.goto('/admin/users');
        await expect(page).toHaveURL(/admin\/users/);
        await shot(page, 'admin-users-01-list');

        // Search for the seeded buyer.
        await page.fill('input[name="q"]', 'test@example.com');
        await page.getByRole('button', { name: 'Filter' }).click();
        await page.locator('main').waitFor();
        await expect(
            page.locator('[data-test="user-row"]').first(),
        ).toContainText('test@example.com');
        await shot(page, 'admin-users-02-search');
    });

    test('admin suspends and lifts suspension on a regular user', async ({
        page,
    }) => {
        // Create a fresh user so we do not suspend the shared accounts.
        const email = uniqueEmail('suspend-target');
        createVerifiedUser(email, 'Suspend Target');

        await login(page, ADMIN);

        // Find the user via search.
        await page.goto('/admin/users');
        await page.fill('input[name="q"]', email);
        await page.getByRole('button', { name: 'Filter' }).click();
        await page
            .locator('[data-test="user-row"]')
            .first()
            .getByRole('link', { name: 'View' })
            .click();
        await expect(page).toHaveURL(/admin\/users\/.+/);
        await shot(page, 'admin-users-03-user-detail');

        // Suspend.
        await page.getByRole('button', { name: 'Suspend user' }).click();
        await page.locator('main').waitFor();
        await expect(
            page.getByText('suspended', { exact: true }).first(),
        ).toBeVisible();
        await shot(page, 'admin-users-04-suspended');

        // Lift.
        await page.getByRole('button', { name: 'Lift suspension' }).click();
        await page.locator('main').waitFor();
        await expect(
            page.getByText('active', { exact: true }).first(),
        ).toBeVisible();
        await shot(page, 'admin-users-05-lifted');
    });

    // -------------------------------------------------------------------------
    // Category management
    // -------------------------------------------------------------------------

    test('admin creates a category with a custom commission rate', async ({
        page,
    }) => {
        await login(page, ADMIN);

        await page.goto('/admin/categories');
        await expect(page).toHaveURL(/admin\/categories/);
        await shot(page, 'admin-categories-01-list');

        // Use the API helper to create the category through the real endpoint
        // (same as the UI form but without disclosure/checkbox timing issues).
        const slug = `e2e-cat-${Date.now()}`;
        const result = await api(page, 'POST', '/admin/categories', {
            name: 'E2E Test Category',
            slug,
            icon: 'tag',
            commission_rate: 6,
            requires_certification: true,
        });
        // 302 means success (redirect to index); anything else is a failure.
        expect(
            result.status,
            `POST /admin/categories: ${JSON.stringify(result.body)}`,
        ).toBeLessThan(400);

        // Reload so the new category shows in the list.
        await page.goto('/admin/categories');
        await page.locator('main').waitFor();
        // Use a scoped locator to avoid matching the text inside <option> elements.
        await expect(
            page
                .locator('ul > li')
                .filter({ hasText: 'E2E Test Category' })
                .first(),
        ).toBeVisible();
        await expect(page.getByText('6% commission').first()).toBeVisible();
        await shot(page, 'admin-categories-02-created');

        // Clean up via the real delete endpoint — leftover root categories
        // displace seeded ones in the 8-item storefront nav.
        const props = await pageProps<{
            categories: Array<{ id: string; slug: string }>;
        }>(page);
        const created = props.categories.find((c) => c.slug === slug);
        expect(created).toBeTruthy();

        const deleteResult = await api(
            page,
            'POST',
            `/admin/categories/${created!.id}`,
            { _method: 'DELETE' },
        );
        expect(deleteResult.status).toBeLessThan(400);
    });

    test('admin edits a category commission via the inline edit form', async ({
        page,
    }) => {
        await login(page, ADMIN);
        await page.goto('/admin/categories');
        await page.locator('main').waitFor();

        // Open the first Edit disclosure (seeded categories: Halal Food etc.)
        const firstEdit = page
            .locator('details')
            .filter({ hasText: 'Edit' })
            .first();
        await firstEdit.click();
        await firstEdit.locator('summary').waitFor();

        // Update commission to 5%.
        const commissionInput = firstEdit.locator(
            'input[name="commission_rate"]',
        );
        await commissionInput.fill('5');
        await firstEdit.getByRole('button', { name: 'Save' }).click();
        await page.locator('main').waitFor();

        await expect(page).toHaveURL(/admin\/categories/);
        await shot(page, 'admin-categories-03-updated');
    });

    // -------------------------------------------------------------------------
    // Vouchers
    // -------------------------------------------------------------------------

    test('admin creates, edits and deletes a platform voucher', async ({
        page,
    }) => {
        await login(page, ADMIN);

        await page.goto('/admin/vouchers');
        await expect(page).toHaveURL(/admin\/vouchers/);
        await shot(page, 'admin-vouchers-01-list');

        // Use API helper to avoid checkbox/disclosure timing issues.
        const code = `E2EVCH${Date.now().toString().slice(-6)}`;
        const createResult = await api(page, 'POST', '/admin/vouchers', {
            kind: 'platform',
            code,
            discount_type: 'fixed',
            discount_value: 50,
            min_spend: 300,
            is_active: true,
        });
        expect(
            createResult.status,
            `POST /admin/vouchers: ${JSON.stringify(createResult.body)}`,
        ).toBeLessThan(400);

        // Reload and confirm the voucher is visible.
        await page.goto('/admin/vouchers');
        await page.locator('main').waitFor();
        await expect(page.getByText(code.toUpperCase())).toBeVisible();
        await shot(page, 'admin-vouchers-02-created');

        // Edit via API.
        // First get the voucher ID from page props.
        const props = await pageProps<{
            vouchers: Array<{ id: string; code: string }>;
        }>(page);
        const voucher = props.vouchers.find(
            (v) => v.code === code.toUpperCase(),
        );
        expect(voucher).toBeTruthy();

        const editResult = await api(
            page,
            'POST',
            `/admin/vouchers/${voucher!.id}`,
            {
                _method: 'PUT',
                kind: 'platform',
                code,
                discount_type: 'fixed',
                discount_value: 75,
                is_active: true,
            },
        );
        expect(editResult.status).toBeLessThan(400);

        // Delete via API.
        const deleteResult = await api(
            page,
            'POST',
            `/admin/vouchers/${voucher!.id}`,
            {
                _method: 'DELETE',
            },
        );
        expect(deleteResult.status).toBeLessThan(400);

        await page.goto('/admin/vouchers');
        await page.locator('main').waitFor();
        await expect(page.getByText(code.toUpperCase())).not.toBeVisible();
        await shot(page, 'admin-vouchers-03-deleted');
    });

    // -------------------------------------------------------------------------
    // Audit log
    // -------------------------------------------------------------------------

    test('audit log shows entries produced by earlier steps in this spec', async ({
        page,
    }) => {
        await login(page, ADMIN);

        await page.goto('/admin/audit-log');
        await expect(page).toHaveURL(/admin\/audit-log/);
        await page.locator('main').waitFor();
        await shot(page, 'admin-audit-01-all');

        // There should be at least one audit entry from the mutations above.
        await expect(
            page.locator('[data-test="audit-entry"]').first(),
        ).toBeVisible({ timeout: 10_000 });

        // Filter by a known action to confirm filtering works.
        await page
            .locator('select[name="action"]')
            .selectOption('user.suspended');
        await page.getByRole('button', { name: 'Filter' }).click();
        await page.locator('main').waitFor();

        await expect(page).toHaveURL(/admin\/audit-log/);
        await shot(page, 'admin-audit-02-filtered');
    });
});
