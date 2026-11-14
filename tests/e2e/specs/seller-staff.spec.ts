import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createVerifiedUser, login, shot, uniqueEmail } from '../helpers';

const SELLER = 'seller@example.com';
const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

function getStaffInvitationUrl(email: string): string {
    const php = `echo URL::temporarySignedRoute("staff-invitations.show", now()->addDays(7), ["staffInvitation" => App\\Models\\ShopStaff::where("email", "${email}")->firstOrFail()->id]);`;
    const out = execSync(`vendor/bin/sail artisan tinker --execute '${php}'`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });
    return out.toString().trim().split('\n').pop()!.trim();
}

test.describe.serial('shop staff management', () => {
    const inviteeEmail = uniqueEmail('staff');

    test.beforeAll(() => {
        execSync(
            `vendor/bin/sail artisan tinker --execute "App\\Models\\ShopStaff::truncate();"`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
    });

    test.afterAll(() => {
        execSync(
            `vendor/bin/sail artisan tinker --execute "App\\Models\\ShopStaff::truncate();"`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
    });

    test('owner views team page with seat count', async ({ page }) => {
        await login(page, SELLER);
        await page.goto('/seller/staff');

        await expect(page.locator('h1')).toContainText('Team');
        await expect(page.locator('body')).toContainText('seats used');
        await shot(page, 'staff-01-team-page');
    });

    test('owner invites a staff member and reaches cap after 2 invites', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto('/seller/staff');

        // Create verified invitee user first so they can sign in later
        createVerifiedUser(inviteeEmail, 'Staff Member');

        // Send first invitation
        await page.fill('input[name="email"]', inviteeEmail);
        await page.getByRole('button', { name: /Send invitation/i }).click();

        await expect(page.locator('body')).toContainText(inviteeEmail);
        await expect(page.locator('body')).toContainText(/pending/i);
        await shot(page, 'staff-02-invite-sent');
    });

    test('invitee accepts invitation and accesses seller workspace', async ({
        page,
    }) => {
        const inviteUrl = getStaffInvitationUrl(inviteeEmail);
        const invitePath =
            new URL(inviteUrl).pathname + new URL(inviteUrl).search;

        await page.context().clearCookies();
        await login(page, inviteeEmail);
        await page.goto(invitePath);

        await expect(page.locator('h1')).toContainText(/staff invitation/i);
        await expect(page.locator('body')).toContainText('What staff can do');
        await shot(page, 'staff-03-invite-view');

        // Accept invitation
        await page.getByRole('button', { name: /Accept invitation/i }).click();
        await page.waitForURL(/\/seller\/dashboard/, { timeout: 15_000 });

        await expect(page.locator('h1')).toContainText(/Assalamu alaikum/i);
        await shot(page, 'staff-04-seller-dashboard');

        // Staff can view products
        await page.goto('/seller/products');
        await expect(page.locator('h1')).toContainText('Products');

        // Staff is blocked from owner-only pages (404)
        const financeResponse = await page.goto('/seller/finance');
        expect(financeResponse?.status()).toBe(404);

        const settingsResponse = await page.goto('/seller/settings');
        expect(settingsResponse?.status()).toBe(404);

        const vouchersResponse = await page.goto('/seller/vouchers');
        expect(vouchersResponse?.status()).toBe(404);

        const teamResponse = await page.goto('/seller/staff');
        expect(teamResponse?.status()).toBe(404);
    });

    test('owner removes staff and member loses access', async ({ page }) => {
        await page.context().clearCookies();
        await login(page, SELLER);
        await page.goto('/seller/staff');

        await expect(page.locator('body')).toContainText(inviteeEmail);
        await expect(page.locator('body')).toContainText(/active/i);

        // Remove the staff member
        page.on('dialog', (dialog) => dialog.accept());
        await page
            .locator(
                `tr:has-text("${inviteeEmail}"), li:has-text("${inviteeEmail}")`,
            )
            .filter({ visible: true })
            .first()
            .getByRole('button', { name: 'Remove' })
            .click();

        await expect(page.locator('body')).not.toContainText(inviteeEmail, {
            timeout: 15_000,
        });
        await shot(page, 'staff-05-member-removed');

        // Invitee can no longer access seller workspace
        await page.context().clearCookies();
        await login(page, inviteeEmail);
        await page.goto('/seller/dashboard');
        await expect(page).toHaveURL(/seller\/register/);
    });
});
