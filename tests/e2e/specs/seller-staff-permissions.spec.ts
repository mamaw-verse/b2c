import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import {
    api,
    createVerifiedUser,
    ensureProductStock,
    login,
    pageProps,
    shot,
} from '../helpers';

const SELLER = 'seller@example.com';
const BUYER = 'test@example.com';
const PRODUCT = 'quran-with-english-translation-hardcover';
const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

// Use a stable, predictable email for the staff fixture so it can be cleaned
// up and re-created reliably across runs without stale state.
const staffEmail = 's14-staff-fixture@example.com';
const staffName = 'S14 Staff';

type PsgcEntry = { code: string; name: string };

/** Resolve the first available PSGC codes through the app's own API. */
async function firstPsgcCodes(page: Parameters<typeof api>[0]) {
    const regions = await api<PsgcEntry[]>(page, 'GET', '/api/psgc/regions');
    const region = regions.body[0];
    const provinces = await api<PsgcEntry[]>(
        page,
        'GET',
        `/api/psgc/regions/${region.code}/provinces`,
    );
    const province = provinces.body[0];
    const cities = await api<PsgcEntry[]>(
        page,
        'GET',
        `/api/psgc/provinces/${province.code}/cities`,
    );
    for (const city of cities.body) {
        const barangays = await api<PsgcEntry[]>(
            page,
            'GET',
            `/api/psgc/cities/${city.code}/barangays`,
        );
        if (barangays.body.length > 0) {
            return { region, province, city, barangay: barangays.body[0] };
        }
    }
    throw new Error('No seeded city with barangays found');
}

/** Create an active ShopStaff record via tinker (skips the invite/accept flow). */
function createActiveStaff(email: string): void {
    const php = `App\\Models\\ShopStaff::create(["shop_id" => App\\Models\\Shop::where("user_id", App\\Models\\User::where("email", "${SELLER}")->value("id"))->value("id"), "user_id" => App\\Models\\User::where("email", "${email}")->value("id"), "email" => "${email}", "status" => App\\Enums\\ShopStaffStatus::Active, "invited_by" => App\\Models\\Shop::where("user_id", App\\Models\\User::where("email", "${SELLER}")->value("id"))->value("user_id"), "invited_at" => now(), "accepted_at" => now()]);`;
    execSync(`vendor/bin/sail artisan tinker --execute '${php}'`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });
}

test.describe.serial('staff permissions and order actions (S-14)', () => {
    let orderId: string;

    test.beforeAll(() => {
        // Wipe any leftover staff rows and the fixture user so we start clean.
        execSync(
            `vendor/bin/sail artisan tinker --execute "App\\Models\\ShopStaff::truncate();"`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
        execSync(
            `vendor/bin/sail artisan tinker --execute "App\\Models\\User::where('email', '${staffEmail}')->forceDelete();"`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
        createVerifiedUser(staffEmail, staffName);
        createActiveStaff(staffEmail);
        ensureProductStock(PRODUCT);
    });

    test.afterAll(() => {
        execSync(
            `vendor/bin/sail artisan tinker --execute "App\\Models\\ShopStaff::truncate();"`,
            { cwd: repoRoot, stdio: 'pipe' },
        );
    });

    test('staff signs in, lands on Orders, and owner-only pages are 404', async ({
        page,
    }) => {
        await login(page, staffEmail);

        // Staff land on Orders (seller home for staff).
        await page.goto('/seller/orders');
        await expect(
            page.getByRole('heading', { name: 'Orders', exact: true }),
        ).toBeVisible();
        await shot(page, 's14-01-staff-orders');

        // Dashboard is owner-only → 404.
        const dash = await page.goto('/seller/dashboard');
        expect(dash?.status()).toBe(404);
        await shot(page, 's14-02-dashboard-404');

        // Customers is owner-only → 404.
        const customers = await page.goto('/seller/customers');
        expect(customers?.status()).toBe(404);
        await shot(page, 's14-03-customers-404');

        // Team page is owner-only → 404.
        const team = await page.goto('/seller/staff');
        expect(team?.status()).toBe(404);
        await shot(page, 's14-04-team-404');

        // Delete product is owner-only → 404.
        await page.goto('/seller/products');
        const props = await pageProps<{ products: { data: { id: string }[] } }>(
            page,
        );
        const productId = props.products.data[0]?.id;
        expect(productId).toBeTruthy();
        const delResult = await api(
            page,
            'DELETE',
            `/seller/products/${productId}`,
        );
        expect(delResult.status).toBe(404);
    });

    test('buyer places an order for the staff to process', async ({ page }) => {
        await login(page, BUYER);

        const psgc = await firstPsgcCodes(page);
        await api(page, 'POST', '/account/addresses', {
            name: 'Test User',
            phone: '+639171234567',
            region_code: psgc.region.code,
            province_code: psgc.province.code,
            city_code: psgc.city.code,
            barangay_code: psgc.barangay.code,
            street: '123 E2E Street',
            postal_code: '1000',
            label: 'home',
            is_default: true,
        });

        await page.goto(`/products/${PRODUCT}`);
        await page.getByRole('button', { name: 'Add to cart' }).first().click();
        await expect(page.getByText(/added to cart/i).first()).toBeVisible();

        await page.goto('/cart');
        await page
            .getByRole('button', { name: /Checkout/ })
            .first()
            .click();
        await expect(page).toHaveURL(/checkout/);
        await page.getByRole('button', { name: 'Place order' }).first().click();
        await expect(page).toHaveURL(/order-confirmed/, { timeout: 15_000 });

        await page.goto('/account/orders');
        await page
            .getByRole('link', { name: 'View', exact: true })
            .first()
            .click();
        await expect(page).toHaveURL(/account\/orders\/.+/, {
            timeout: 15_000,
        });
        // Extract orderId from the URL — avoids relying on Inertia client-side
        // props after a router.visit() (script[data-page] is only fresh on a
        // full page load).
        orderId = page.url().split('/').pop()!;
    });

    test('staff arranges shipment and replies in chat', async ({ page }) => {
        await login(page, staffEmail);

        await page.goto('/seller/orders');
        await expect(
            page.locator(`a[href="/seller/orders/${orderId}"]`),
        ).toBeVisible();
        await shot(page, 's14-05-staff-orders-list');

        await page
            .locator(`a[href="/seller/orders/${orderId}"]`)
            .first()
            .click();
        await expect(page).toHaveURL(/seller\/orders\/.+/);
        await shot(page, 's14-06-staff-order-detail');

        // Arrange shipment (only if the order hasn't shipped yet).
        const shipBtn = page.getByRole('button', { name: /Arrange shipment/ });
        if (await shipBtn.isVisible()) {
            await shipBtn.click();
            await page.getByLabel(/Courier/i).fill('J&T Express');
            await page.getByLabel(/Tracking number/i).fill('PH-S1412345678');
            await page
                .getByRole('button', { name: 'Confirm shipment' })
                .click();
            await expect(page.getByText(/To.?Receive/i).first()).toBeVisible({
                timeout: 15_000,
            });
        }
        await shot(page, 's14-07-staff-shipment');

        // Start a chat conversation and send a message.
        // The chat element may be an <a> (existing conversation) or a POST
        // button (new conversation) — both share aria-label="Chat with buyer".
        await page.locator('[aria-label="Chat with buyer"]').click();
        await expect(page).toHaveURL(/\/seller\/chat\//, { timeout: 15_000 });
        await expect(page.locator('#chat-composer-input')).toBeVisible({
            timeout: 15_000,
        });
        await shot(page, 's14-08-staff-chat');

        await page.fill(
            '#chat-composer-input',
            'Hello from staff! Your order is on the way.',
        );
        await page.getByRole('button', { name: 'Send' }).click();
        await expect(
            page
                .locator('[data-ds-bubble-text]')
                .filter({
                    hasText: 'Hello from staff! Your order is on the way.',
                })
                .first(),
        ).toBeVisible({ timeout: 10_000 });
        await shot(page, 's14-09-staff-chat-reply');
    });

    test('buyer confirms receipt and requests a return', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        await expect(
            page.getByText('PH-S1412345678', { exact: false }).first(),
        ).toBeVisible();

        page.once('dialog', (dialog) => dialog.accept());
        await page
            .getByRole('button', { name: 'Order received', exact: true })
            .click();
        await expect(
            page.getByText('Completed', { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Request a return/refund.
        await page.getByRole('button', { name: 'Return / refund' }).click();
        const returnModal = page.locator('dialog[open]');
        await expect(returnModal).toContainText('Request Return / Refund');
        await returnModal.locator('input[type="checkbox"]').first().check();
        await returnModal.locator('input[type="number"]').first().fill('1');
        await returnModal
            .locator('textarea')
            .fill('S14: item arrived damaged.');
        await returnModal
            .getByRole('button', { name: 'Submit request' })
            .click();
        await expect(
            page.getByText('Return/refund requested', { exact: false }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 's14-10-buyer-return-request');
    });

    test('staff resolves the return request', async ({ page }) => {
        await login(page, staffEmail);
        await page.goto(`/seller/orders/${orderId}`);
        await expect(
            page.getByRole('heading', { name: 'Return/refund request' }),
        ).toBeVisible();
        await expect(
            page.getByText('S14: item arrived damaged.').first(),
        ).toBeVisible();
        await shot(page, 's14-11-staff-return-request');

        // Decline the return.
        await page
            .getByRole('button', { name: 'Decline', exact: true })
            .first()
            .click();
        const declineModal = page.locator('dialog[open]');
        await expect(declineModal).toContainText('Decline return/refund');
        await declineModal
            .locator('textarea')
            .fill('S14: cannot approve this request.');
        await declineModal
            .getByRole('button', { name: 'Decline', exact: true })
            .click();
        await expect(
            page.getByText('Completed', { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 's14-12-staff-return-resolved');
    });

    test('owner sees who replied in chat and who resolved the return', async ({
        page,
    }) => {
        await login(page, SELLER);

        // The order timeline shows "Resolved by <staff name>".
        await page.goto(`/seller/orders/${orderId}`);
        // Wait for the full page including the timeline section to hydrate.
        await page.waitForLoadState('networkidle');
        await shot(page, 's14-13-owner-order-detail');
        // The timeline section renders below Payment; check it's in the DOM.
        await expect(
            page.getByText('Return/refund declined').first(),
        ).toBeAttached({ timeout: 10_000 });
        await expect(
            page.getByText(`Resolved by ${staffName}`).first(),
        ).toBeAttached({ timeout: 5_000 });

        // Navigate to the chat and see the staff reply.
        await page.goto('/seller/chat');
        await expect(
            page.getByRole('heading', { name: 'Chats', exact: true }),
        ).toBeVisible();
        await shot(page, 's14-14-owner-chat-list');

        await page.locator('a[href*="/seller/chat/"]').first().click();
        await expect(page).toHaveURL(/\/seller\/chat\/.+/);
        await shot(page, 's14-15-owner-chat-thread');

        const repliedBy = page.getByText(`Replied by ${staffName}`).first();
        await repliedBy.scrollIntoViewIfNeeded();
        await expect(repliedBy).toBeVisible({ timeout: 10_000 });
        await shot(page, 's14-16-owner-sees-staff-reply');
    });
});
