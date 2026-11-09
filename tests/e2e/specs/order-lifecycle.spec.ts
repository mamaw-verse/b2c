import { expect, test } from '@playwright/test';
import { api, login, pageProps, shot } from '../helpers';

const BUYER = 'test@example.com';
const SELLER = 'seller@example.com';
const ADMIN = 'admin@example.com';

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
        await page.goto('/products/quran-with-english-translation-hardcover');
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

        // Cart → checkout → place order.
        await page.goto('/cart');
        await shot(page, 'buyer-02-cart');
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

        // Order appears under the buyer's account.
        await page.goto('/account/orders');
        await shot(page, 'buyer-05-orders');
        await page.getByRole('link', { name: 'View details' }).first().click();
        await expect(page).toHaveURL(/account\/orders\/.+/);
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

        await page.goto('/seller/orders?status=to_ship');
        await expect(
            page.locator('a[href*="/seller/orders/"]').first(),
        ).toBeVisible();
        await shot(page, 'seller-02-orders');

        await page
            .locator(`a[href="/seller/orders/${orderId}"]`)
            .first()
            .click();
        await expect(page).toHaveURL(/seller\/orders\/.+/);
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
        await expect(page).toHaveURL(/admin\/moderation$/, {
            timeout: 15_000,
        });
        await shot(page, 'admin-04-decided');
    });
});
