import { expect, test } from '@playwright/test';
import {
    api,
    createVerifiedUser,
    ensureProductStock,
    login,
    pageProps,
    shot,
    uniqueEmail,
} from '../helpers';

const BUYER = 'test@example.com';
const SELLER = 'seller@example.com';
const ADMIN = 'admin@example.com';
const PRODUCT = 'quran-with-english-translation-hardcover';

// Checkouts consume the seeded stock, so restock before this file's specs run.
test.beforeAll(() => ensureProductStock(PRODUCT));

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
    // The PSGC seed only populates some cities — pick one with barangays.
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

test.describe.serial('full order lifecycle', () => {
    let orderId: string;
    let reference: string;
    let total: number;
    test('buyer browses, checks out, and sees the order', async ({ page }) => {
        await login(page, BUYER);

        // Seed a delivery address via the app's own endpoint.
        const psgc = await firstPsgcCodes(page);
        const address = await api(page, 'POST', '/account/addresses', {
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
        expect(address.status).toBeLessThan(400);

        // Browse a seeded Barakah Pantry product.
        await page.goto(`/products/${PRODUCT}`);
        await shot(page, 'buyer-01-product');
        const props = await pageProps<{ product: { id: string } }>(page);
        const productId = props.product.id;

        // Add to cart through the real UI button.
        await page.getByRole('button', { name: 'Add to cart' }).first().click();
        await expect(page.getByText(/added to cart/i).first()).toBeVisible();

        // File a report so the admin moderation queue has an item to review.
        await api(page, 'POST', '/reports', {
            target_type: 'product',
            target_id: productId,
            reason: 'Unverified halal claim (e2e)',
            details: 'Automated e2e report for moderation coverage.',
        });

        // Cart → checkout → place order. Bump the quantity to 2 so the
        // return/refund flow below can exercise a partial refund (qa3
        // task 7.1).
        await page.goto('/cart');
        await shot(page, 'buyer-02-cart');
        await page
            .getByRole('button', { name: 'Increase quantity' })
            .first()
            .click();
        await expect(
            page
                .getByRole('group', { name: 'Quantity' })
                .locator('input')
                .first(),
        ).toHaveValue('2');
        await page
            .getByRole('button', { name: /Checkout/ })
            .first()
            .click();
        await expect(page).toHaveURL(/checkout/);
        await shot(page, 'buyer-03-checkout');

        await page.getByRole('button', { name: 'Place order' }).first().click();
        await expect(page).toHaveURL(/order-confirmed/, {
            timeout: 15_000,
        });
        await expect(
            page.getByText(/order has been placed|order placed/i).first(),
        ).toBeVisible();
        await shot(page, 'buyer-04-order-placed');

        // Order appears under the buyer's account orders table.
        await page.goto('/account/orders');
        await expect(
            page.getByRole('heading', { name: 'My Purchases' }),
        ).toBeVisible();
        await shot(page, 'buyer-05-orders');
        await page
            .getByRole('link', { name: 'View', exact: true })
            .first()
            .click();
        await expect(page).toHaveURL(/account\/orders\/.+/);
        // Fulfilment lines show the uploaded product photo (qa3 task 6.3).
        await expect(
            page.locator('img[src*="prod-quran-hardcover"]').first(),
        ).toBeVisible();
        await shot(page, 'buyer-06-order-detail');
        await page.reload();
        const detail = await pageProps<{
            order: { id: string; reference: string; total: number };
        }>(page);
        orderId = detail.order.id;
        reference = detail.order.reference;
        total = detail.order.total;
    });

    test('seller sees the order and arranges shipment', async ({ page }) => {
        await login(page, SELLER);

        await page.goto('/seller/dashboard');
        await shot(page, 'seller-01-dashboard');

        await page.goto('/seller/orders');
        await expect(
            page.getByRole('heading', { name: 'Orders', exact: true }),
        ).toBeVisible();
        await expect(
            page.locator(`a[href="/seller/orders/${orderId}"]`),
        ).toBeVisible();
        await shot(page, 'seller-02-orders');

        await page
            .locator(`a[href="/seller/orders/${orderId}"]`)
            .first()
            .click();
        await expect(page).toHaveURL(/seller\/orders\/.+/);

        // The customer panel links through to the seller customer profile
        // (qa3 task 6.2) and fulfilment cards render the real product photo
        // instead of only the icon (task 6.3).
        await expect(
            page.getByRole('heading', { name: 'Customer' }),
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'View profile' }),
        ).toHaveAttribute('href', /\/seller\/customers\//);
        await expect(
            page.locator('img[src*="prod-quran-hardcover"]').first(),
        ).toBeVisible();
        await shot(page, 'seller-03-order');

        await page.getByRole('button', { name: /Arrange shipment/ }).click();
        await shot(page, 'seller-04-ship-modal');
        await page.getByLabel(/Courier/i).fill('J&T Express');
        await page.getByLabel(/Tracking number/i).fill('PH-E2E1234567');
        await page.getByRole('button', { name: 'Confirm shipment' }).click();

        await expect(page.getByText(/To.?Receive/i).first()).toBeVisible({
            timeout: 15_000,
        });
        await shot(page, 'seller-05-shipped');
    });

    test('buyer confirms receipt and reviews the shipped order', async ({
        page,
    }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        const detail = await pageProps<{
            order: { reference: string; total: number };
        }>(page);
        expect(detail.order.reference).toBe(reference);
        expect(detail.order.total).toBe(total);
        await expect(
            page.getByText('PH-E2E1234567', { exact: false }).first(),
        ).toBeVisible();
        // J&T Express has a configured tracking template, so a tracking link renders.
        await expect(
            page.getByRole('link', { name: /Track parcel/ }).first(),
        ).toBeVisible();
        await shot(page, 'buyer-07-tracking');

        page.once('dialog', (dialog) => dialog.accept());
        await page
            .getByRole('button', { name: 'Order received', exact: true })
            .click();
        await expect(
            page.getByText('Completed', { exact: true }).first(),
        ).toBeVisible();
        await shot(page, 'buyer-08-received');
        await page
            .getByRole('link', { name: 'Write a review' })
            .first()
            .click();
        await page
            .locator('#review-text')
            .fill('The order arrived in good condition. E2E lifecycle review.');
        await shot(page, 'buyer-09-review');
        await page.getByRole('button', { name: /Submit review/i }).click();
        await expect(page).toHaveURL(new RegExp(`/account/orders/${orderId}$`));
        await shot(page, 'buyer-10-reviewed');
    });

    test('admin reviews dashboard and decides a moderation item', async ({
        page,
    }) => {
        await login(page, ADMIN);

        await page.goto('/admin/dashboard');
        await shot(page, 'admin-01-dashboard');

        await page.goto('/admin/moderation');
        await expect(
            page.locator('a[href*="/admin/moderation/"]').first(),
        ).toBeVisible();
        await shot(page, 'admin-02-queue');

        await page.locator('a[href*="/admin/moderation/"]').first().click();
        await expect(page).toHaveURL(/admin\/moderation\/.+/);
        await shot(page, 'admin-03-item');

        await page
            .getByRole('button', { name: /^Approve$/ })
            .first()
            .click();
        const confirm = page.locator('dialog[open]');
        await expect(confirm).toContainText('Approve item');
        await confirm
            .getByRole('button', { name: 'Approve', exact: true })
            .click();
        await expect(page).toHaveURL(/admin\/moderation$/, {
            timeout: 15_000,
        });
        await shot(page, 'admin-04-decided');
    });

    test('buyer requests a return/refund on the completed order', async ({
        page,
    }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        await page.getByRole('button', { name: 'Return / refund' }).click();
        const returnModal = page.locator('dialog[open]');
        await expect(returnModal).toContainText('Request Return / Refund');
        // The modal lists each item with a checkbox and quantity (qa3 task
        // 7.1); request one of the two units so the seller can approve a
        // partial refund.
        await returnModal.locator('input[type="checkbox"]').first().check();
        await returnModal.locator('input[type="number"]').first().fill('1');
        await returnModal
            .locator('textarea')
            .fill('E2E: item arrived damaged.');
        await shot(page, 'buyer-11-return-request');
        await returnModal
            .getByRole('button', { name: 'Submit request' })
            .click();
        await expect(
            page.getByText('Return/refund requested', { exact: false }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 'buyer-12-return-pending');
    });

    test('seller sees the return request and declines it with a note', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto(`/seller/orders/${orderId}`);
        await expect(
            page.getByRole('heading', { name: 'Return/refund request' }),
        ).toBeVisible();
        await expect(
            page.getByText('E2E: item arrived damaged.').first(),
        ).toBeVisible();
        await shot(page, 'seller-06-return-request');
        await page
            .getByRole('button', { name: 'Decline', exact: true })
            .first()
            .click();
        const declineModal = page.locator('dialog[open]');
        await expect(declineModal).toContainText('Decline return/refund');
        await declineModal
            .locator('textarea')
            .fill('E2E: cannot approve this request.');
        await shot(page, 'seller-07-decline-modal');
        await declineModal
            .getByRole('button', { name: 'Decline', exact: true })
            .click();
        await expect(
            page.getByText('Completed', { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 'seller-08-declined');
    });

    test('buyer sees the decline outcome and re-requests the return', async ({
        page,
    }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        await expect(page.getByText('Return/refund declined.')).toBeVisible({
            timeout: 15_000,
        });
        await expect(
            page.getByText(/Reason: E2E: cannot approve this request\./),
        ).toBeVisible();
        await shot(page, 'buyer-13-return-declined');

        await page.getByRole('button', { name: 'Return / refund' }).click();
        const secondReturnModal = page.locator('dialog[open]');
        await secondReturnModal
            .locator('input[type="checkbox"]')
            .first()
            .check();
        await secondReturnModal
            .locator('input[type="number"]')
            .first()
            .fill('1');
        await secondReturnModal
            .locator('textarea')
            .fill('E2E: second return request.');
        await secondReturnModal
            .getByRole('button', { name: 'Submit request' })
            .click();
        await expect(
            page.getByText('Return/refund requested', { exact: false }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test('seller approves a partial refund and the order stays completed', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto(`/seller/orders/${orderId}`);
        await expect(
            page.getByText('E2E: second return request.').first(),
        ).toBeVisible();

        // The buyer requested 1 of 2 units, so the selections default to
        // the requested quantity and the button offers a partial refund
        // (qa3 task 7.1).
        const approve = page.getByRole('button', {
            name: 'Approve partial refund',
            exact: true,
        });
        await expect(approve).toBeVisible();
        await expect(
            page.getByText('Refund total:', { exact: false }),
        ).toBeVisible();
        page.once('dialog', (dialog) => dialog.accept());
        await approve.click();

        // A partial refund returns the order to Completed and logs a
        // "Partial refund approved" event with a help link (qa3 tasks 7.1
        // and 7.2).
        await expect(
            page.getByText('Partial refund approved', { exact: false }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByRole('link', { name: /How refunds work/ }).first(),
        ).toBeVisible();
        await shot(page, 'seller-09-partial-refund');
    });

    test('buyer requests the remaining unit after the partial refund', async ({
        page,
    }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        // The order is back to Completed, so it can be returned again for
        // the one unit that was not refunded.
        await page.getByRole('button', { name: 'Return / refund' }).click();
        const returnModal = page.locator('dialog[open]');
        await returnModal.locator('input[type="checkbox"]').first().check();
        await returnModal.locator('input[type="number"]').first().fill('1');
        await returnModal
            .locator('textarea')
            .fill('E2E: final return request.');
        await returnModal
            .getByRole('button', { name: 'Submit request' })
            .click();
        await expect(
            page.getByText('Return/refund requested', { exact: false }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test('seller approves the remaining refund and the order is refunded', async ({
        page,
    }) => {
        await login(page, SELLER);
        await page.goto(`/seller/orders/${orderId}`);
        await expect(
            page.getByText('E2E: final return request.').first(),
        ).toBeVisible();
        const approve = page.getByRole('button', {
            name: 'Approve full refund',
            exact: true,
        });
        await expect(approve).toBeVisible();
        page.once('dialog', (dialog) => dialog.accept());
        await approve.click();
        await expect(
            page.getByText('Refunded', { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 'seller-10-refunded');
    });

    test('buyer sees the approved refund outcome', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(`/account/orders/${orderId}`);
        await expect(
            page.getByText('Your refund has been approved.'),
        ).toBeVisible({ timeout: 15_000 });
        // Refund timeline events link to the returns policy page (qa3 task
        // 7.2).
        await expect(
            page.getByRole('link', { name: /How refunds work/ }).first(),
        ).toBeVisible();
        await shot(page, 'buyer-14-refunded');
    });
});

test.describe('order cancellation', () => {
    test('buyer cancels a pending order', async ({ page }) => {
        const email = uniqueEmail('cancel');
        createVerifiedUser(email, 'Cancel E2E');
        await login(page, email);

        const psgc = await firstPsgcCodes(page);
        const address = await api(page, 'POST', '/account/addresses', {
            name: 'Cancel E2E',
            phone: '+639171234567',
            region_code: psgc.region.code,
            province_code: psgc.province.code,
            city_code: psgc.city.code,
            barangay_code: psgc.barangay.code,
            street: '123 Cancel Street',
            postal_code: '1000',
            label: 'home',
            is_default: true,
        });
        expect(address.status).toBeLessThan(400);

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
        await expect(page).toHaveURL(/order-confirmed/, {
            timeout: 15_000,
        });

        await page.goto('/account/orders');
        await page
            .getByRole('link', { name: 'View', exact: true })
            .first()
            .click();
        await expect(page).toHaveURL(/account\/orders\/.+/);

        await page.getByRole('button', { name: 'Cancel order' }).click();
        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Cancel Order');
        await dialog
            .getByRole('button', { name: 'Confirm cancellation' })
            .click();

        await expect(
            page.getByText('Cancelled', { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 'buyer-cancel-01');
    });
});
