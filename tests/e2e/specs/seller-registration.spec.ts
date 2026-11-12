import { expect, test, type Page } from '@playwright/test';
import { api, createVerifiedUser, login, shot, uniqueEmail } from '../helpers';

const ADMIN = 'admin@example.com';

// Each project run gets a fresh verified applicant (created in beforeAll)
// so the register → apply → approve → workspace flow is exercised for real
// instead of skipping when the shared fixture is already an approved seller.
let applicantEmail: string;
let shopName: string;

const PNG_1PX = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);
const MINIMAL_PDF = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n',
);

type PsgcEntry = { code: string; name: string; postal_code?: string };

/** Focus a combobox and pick the first option via the keyboard. */
async function pickFirstOption(page: Page, id: string) {
    await page.locator(`#${id}`).click();
    await page.locator(`#${id}-list [role="option"]`).first().waitFor();
    await page.locator(`#${id}`).press('ArrowDown');
    await page.locator(`#${id}`).press('Enter');
}

/** Type into a combobox and select the first matching option via the keyboard. */
async function pickOptionByLabel(page: Page, id: string, label: string) {
    await page.locator(`#${id}`).click();
    await page.locator(`#${id}-list [role="option"]`).first().waitFor();
    await page.locator(`#${id}`).fill(label);
    await page.locator(`#${id}`).press('Enter');
}

/**
 * Fill the PSGC address fields: first region/province, then a city that has
 * both barangays and a postal code in the PSGC data. PSGC selections and
 * file uploads are not persisted between applications, so resubmissions
 * after "changes requested" must call this again.
 */
async function pickAddress(page: Page) {
    await pickFirstOption(page, 'f-region');
    await pickFirstOption(page, 'f-province');

    // The UI lists options in API order, so "first option" matches the
    // first entry of the same endpoints.
    const regions = await api<PsgcEntry[]>(page, 'GET', '/api/psgc/regions');
    const provinces = await api<PsgcEntry[]>(
        page,
        'GET',
        `/api/psgc/regions/${regions.body[0].code}/provinces`,
    );
    const cities = await api<PsgcEntry[]>(
        page,
        'GET',
        `/api/psgc/provinces/${provinces.body[0].code}/cities`,
    );

    let city = cities.body[0];
    for (const candidate of cities.body) {
        if (!candidate.postal_code) continue;
        const barangays = await api<PsgcEntry[]>(
            page,
            'GET',
            `/api/psgc/cities/${candidate.code}/barangays`,
        );
        if (barangays.body.length > 0) {
            city = candidate;
            break;
        }
    }

    await pickOptionByLabel(page, 'f-city', city.name);
    await pickFirstOption(page, 'f-barangay');
    await page.locator('#f-street').fill('Unit 4B, 12 E2E Street');

    // The postal code is auto-filled and locked when the city has one.
    const postal = page.locator('#f-postal');
    if (city.postal_code) {
        await expect(postal).toHaveValue(city.postal_code);
        await expect(postal).toHaveAttribute('readonly', '');
    } else {
        await postal.fill('7000');
    }
}

const uploadPdf = {
    name: 'document.pdf',
    mimeType: 'application/pdf',
    buffer: MINIMAL_PDF,
};

test.describe.serial('seller registration', () => {
    test.beforeAll(() => {
        applicantEmail = uniqueEmail('seller-applicant');
        shopName = `E2E Shop ${Date.now().toString(36)}`;
        createVerifiedUser(applicantEmail, 'E2E Seller Applicant');
    });

    test('empty submit shows a focused error summary', async ({ page }) => {
        await login(page, applicantEmail);
        const response = await page.goto('/seller/register');
        expect(response?.status()).toBe(200);

        await shot(page, 'seller-reg-01-form');

        // All four PSGC selects start empty with placeholders.
        for (const id of ['f-region', 'f-province', 'f-city', 'f-barangay']) {
            await expect(page.locator(`#${id}`)).toHaveValue('');
        }

        // The logo uploader is a compact 96px square, not a full-width tile.
        const logoDrop = page.locator('[data-file-field="f-logo"] button');
        const logoBox = await logoDrop.boundingBox();
        expect(logoBox?.width).toBe(96);
        expect(logoBox?.height).toBe(96);

        // The terms checkbox links to the Seller Terms page in a new tab.
        const termsLink = page.getByRole('link', { name: 'Seller Terms' });
        await expect(termsLink).toHaveAttribute('href', '/seller/terms');
        await expect(termsLink).toHaveAttribute('target', '_blank');

        // Issuing body and certificate number inputs share a top edge/height
        // at md+; on mobile they stack with identical height.
        const body = await page
            .locator('#cert-0-certifying_body')
            .boundingBox();
        const number = await page
            .locator('#cert-0-certificate_number')
            .boundingBox();
        expect(body?.height).toBe(number?.height);
        if ((page.viewportSize()?.width ?? 0) < 768) {
            expect(number?.y).toBeGreaterThan(body?.y ?? 0);
        } else {
            expect(body?.y).toBe(number?.y);
        }

        // Check the two declarations so native required checks pass, then
        // submit empty — the server must reject and surface the summary.
        await page.locator('#f-terms').check();
        await page
            .getByRole('checkbox', {
                name: /true and correct/i,
            })
            .check();
        await page.getByRole('button', { name: 'Submit application' }).click();

        const summary = page.locator('[data-test="error-summary"]');
        await expect(summary).toBeVisible();
        await expect(summary).toBeFocused();
        // The exact links depend on which fields were prefilled (a rejected
        // application refills text fields), but a permit is never prefilled.
        await expect(
            summary.getByRole('link', { name: 'Business permit' }),
        ).toBeVisible();
        await shot(page, 'seller-reg-02-error-summary');
    });

    test('a buyer completes and submits the application', async ({ page }) => {
        await login(page, applicantEmail);
        const response = await page.goto('/seller/register');
        expect(response?.status()).toBe(200);

        // 1. Shop profile.
        await page.locator('#f-shop-name').fill(shopName);
        await page
            .locator('#f-description')
            .fill('Pantry staples and halal-certified ready meals.');
        await page.locator('#f-logo-file').setInputFiles({
            name: 'logo.png',
            mimeType: 'image/png',
            buffer: PNG_1PX,
        });
        // The avatar uploader swaps to a 96px preview after selection.
        await expect(
            page.locator('[data-file-field="f-logo"] img'),
        ).toBeVisible();
        await expect(
            page.locator('[data-test="checklist-profile"]').first(),
        ).toHaveAttribute('data-done', 'true');

        // 2. Address.
        await pickAddress(page);
        await expect(
            page.locator('[data-test="checklist-address"]').first(),
        ).toHaveAttribute('data-done', 'true');

        // 3. Documents.
        await page.locator('#f-permit-file').setInputFiles({
            name: 'permit.pdf',
            mimeType: 'application/pdf',
            buffer: MINIMAL_PDF,
        });

        // Add then remove a second certificate.
        await page
            .getByRole('button', { name: 'Add another certificate' })
            .click();
        await expect(page.locator('fieldset legend')).toHaveCount(2);
        await page
            .locator('fieldset')
            .nth(1)
            .getByRole('button', { name: 'Remove' })
            .click();
        await expect(page.locator('fieldset legend')).toHaveCount(1);

        await page
            .locator('#cert-0-certifying_body')
            .fill('Islamic Da’wah Council of the Philippines (IDCP)');
        await page.locator('#cert-0-certificate_number').fill('HC-2026-12345');
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const validUntil = future.toISOString().slice(0, 10);
        await page.locator('#cert-0-valid_until').fill(validUntil);
        await page.locator('#cert-0-document-file').setInputFiles({
            name: 'certificate.pdf',
            mimeType: 'application/pdf',
            buffer: MINIMAL_PDF,
        });
        await expect(
            page.locator('[data-test="checklist-documents"]').first(),
        ).toHaveAttribute('data-done', 'true');

        // 4. Review & submit.
        await page.locator('#f-terms').check();
        await page.getByRole('checkbox', { name: /true and correct/i }).check();
        await page.locator('#f-halal').check();
        await expect(
            page.locator('[data-test="checklist-declaration"]').first(),
        ).toHaveAttribute('data-done', 'true');

        await shot(page, 'seller-reg-03-filled');

        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.getByText('Application under review')).toBeVisible({
            timeout: 15_000,
        });
        await shot(page, 'seller-reg-04-pending');
    });

    test('admin requests changes on the application', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto(
            '/admin/moderation?type=shop_application&state=pending',
        );

        const item = page.locator('a[href*="/admin/moderation/"]', {
            hasText: shopName,
        });
        await expect(item).toBeVisible();
        await item.click();
        await expect(page).toHaveURL(/admin\/moderation\/.+/);
        await shot(page, 'seller-reg-06-request-item');

        // Narrow containers tuck the secondary actions behind "More actions".
        const requestButton = page.getByRole('button', {
            name: 'Request changes',
            exact: true,
        });
        if (await requestButton.first().isVisible()) {
            await requestButton.first().click();
        } else {
            await page.getByRole('button', { name: 'More actions' }).click();
            // The popover opens upward into the sticky bar's stacking
            // context, so the bottom nav can overlap it on small screens —
            // dispatch the click directly on the menu item.
            await page
                .getByRole('menuitem', { name: 'Request changes' })
                .dispatchEvent('click');
        }

        const dialog = page.locator('dialog[open]');
        await expect(dialog).toContainText('Request changes');
        await dialog
            .locator('#mab-request-reason')
            .fill('Please upload a clearer business permit scan.');
        await shot(page, 'seller-reg-07-request-dialog');
        await dialog.getByRole('button', { name: 'Send request' }).click();

        // The item stays in the queue as flagged and the decision redirects
        // back to the moderation index.
        await expect(page).toHaveURL(/admin\/moderation$/, {
            timeout: 15_000,
        });
        await shot(page, 'seller-reg-08-request-sent');
    });

    test('the seller sees the requested changes and resubmits', async ({
        page,
    }) => {
        await login(page, applicantEmail);
        await page.goto('/seller/register');

        await expect(
            page.getByText('Changes were requested on your application'),
        ).toBeVisible();
        await expect(
            page.getByText(/clearer business permit scan/),
        ).toBeVisible();
        await expect(page.locator('#f-shop-name')).toHaveValue(shopName);
        await shot(page, 'seller-reg-09-changes-banner');

        // PSGC selections and file uploads are not persisted — redo them.
        await pickAddress(page);
        await page.locator('#f-permit-file').setInputFiles(uploadPdf);
        await page.locator('#cert-0-document-file').setInputFiles(uploadPdf);

        await page.locator('#f-terms').check();
        await page.getByRole('checkbox', { name: /true and correct/i }).check();
        await page.locator('#f-halal').check();

        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.getByText('Application under review')).toBeVisible({
            timeout: 15_000,
        });
        await shot(page, 'seller-reg-10-resubmitted');
    });

    test('admin approves the resubmitted application', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto(
            '/admin/moderation?type=shop_application&state=pending',
        );

        // Resubmission re-opened the same queue item as pending.
        const item = page.locator('a[href*="/admin/moderation/"]', {
            hasText: shopName,
        });
        await expect(item).toBeVisible();
        await shot(page, 'seller-reg-05-queue');

        await item.click();
        await expect(page).toHaveURL(/admin\/moderation\/.+/);
        // The snapshot shows the shop name and the submitted documents.
        await expect(page.getByText(shopName).first()).toBeVisible();
        await expect(page.getByText('Business permit').first()).toBeVisible();
        await shot(page, 'seller-reg-06-application');

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
        await shot(page, 'seller-reg-07-approved');
    });

    test('the approved applicant enters the seller workspace', async ({
        page,
    }) => {
        await login(page, applicantEmail);
        await page.goto('/seller/dashboard');

        // The application was approved above — the workspace must open.
        await expect(page).toHaveURL(/seller\/dashboard/);
        await shot(page, 'seller-reg-08-dashboard');
    });

    test('seller terms page is public and marked as draft', async ({
        page,
    }) => {
        await page.goto('/seller/terms');
        await expect(
            page.getByRole('heading', { name: 'Seller Terms', level: 1 }),
        ).toBeVisible();
        await expect(page.getByText(/Version .* · Last updated/)).toBeVisible();
        await expect(
            page.getByText('Draft', { exact: true }).first(),
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Back to the seller application' }),
        ).toHaveAttribute('href', '/seller/register');
        await shot(page, 'seller-terms');
    });
});
