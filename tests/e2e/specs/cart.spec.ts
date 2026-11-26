import { expect, test, type Page } from '@playwright/test';
import { createVerifiedUser, login, shot, uniqueEmail } from '../helpers';

const AJWA = '/products/ajwa-dates-500g-premium-grade-resealable-tub';

// The seeded Ajwa listing has Grade (Premium/Standard/Sukkari) × Weight
// (250g/500g/1kg) variations; Sukkari 500g is the sold-out combination.
let email: string;

test.beforeAll(() => {
    email = uniqueEmail('cart-variation');
    createVerifiedUser(email, 'Cart Variation E2E');
});

test.describe('cart variation editing', () => {
    test('buyer adds a variation and changes it from the cart', async ({
        page,
    }) => {
        await login(page, email);
        await page.goto(AJWA);

        await page.getByRole('button', { name: 'Add to cart' }).first().click();
        const picker = page.locator('dialog[open]');
        await expect(picker).toContainText('Select variation');

        // Pick Standard · 1kg (₱999) instead of the default Premium · 250g.
        await picker.getByText('Standard', { exact: true }).click();
        await picker.getByText('1kg', { exact: true }).click();
        await picker
            .getByRole('button', { name: 'Add to cart', exact: true })
            .click();
        await expect(page.getByText(/added to cart/i).first()).toBeVisible();

        await page.goto('/cart');
        const chip = page.getByRole('button', {
            name: /Variation: Standard · 1kg/,
        });
        await expect(chip).toBeVisible();
        await shot(page, 'cart-01-variation');

        // The chip reopens the picker in edit mode (qa3 task 2.1).
        await chip.click();
        const editPicker = page.locator('dialog[open]');
        await expect(editPicker).toContainText('Change variation');
        await editPicker.getByText('Premium', { exact: true }).click();
        await shot(page, 'cart-02-edit-picker');
        await editPicker
            .getByRole('button', { name: 'Update', exact: true })
            .click();

        await expect(
            page.getByRole('button', { name: /Variation: Premium · 250g/ }),
        ).toBeVisible({ timeout: 15_000 });
        await shot(page, 'cart-03-updated');
    });
});

// Wave 4 (T7, qa3 2.1): merging and sold-out handling when changing a
// variation from the cart. Selectors from the source; not yet run.
async function addAjwa(
    page: Page,
    grade?: string,
    weight?: string,
): Promise<void> {
    await page.goto(AJWA);
    await page.getByRole('button', { name: 'Add to cart' }).first().click();

    const picker = page.locator('dialog[open]');
    await expect(picker).toContainText('Select variation');
    if (grade) {
        await picker.getByText(grade, { exact: true }).click();
    }
    if (weight) {
        await picker.getByText(weight, { exact: true }).click();
    }
    await picker
        .getByRole('button', { name: 'Add to cart', exact: true })
        .click();
    await expect(page.getByText(/added to cart/i).first()).toBeVisible();
}

test.describe('cart variation merge and stock', () => {
    test('changing to a variation already in the cart merges the lines', async ({
        page,
    }) => {
        const mergeEmail = uniqueEmail('cart-merge');
        createVerifiedUser(mergeEmail, 'Cart Merge E2E');
        await login(page, mergeEmail);

        await addAjwa(page); // default Premium · 250g
        await addAjwa(page, 'Standard', '1kg');

        await page.goto('/cart');
        const premium = page.getByRole('button', {
            name: /Variation: Premium · 250g/,
        });
        const standard = page.getByRole('button', {
            name: /Variation: Standard · 1kg/,
        });
        await expect(premium).toBeVisible();
        await expect(standard).toBeVisible();
        await shot(page, 'cart-04-two-lines');

        await standard.click();
        const picker = page.locator('dialog[open]');
        await expect(picker).toContainText('Change variation');
        await picker.getByText('Premium', { exact: true }).click();
        await picker
            .getByRole('button', { name: 'Update', exact: true })
            .click();

        // One line remains and carries the combined quantity.
        await expect(standard).toHaveCount(0, { timeout: 15_000 });
        await expect(premium).toHaveCount(1);
        const line = page.locator('li').filter({ has: premium });
        await expect(
            line.getByRole('group', { name: 'Quantity' }).locator('input'),
        ).toHaveValue('2');
        await shot(page, 'cart-05-merged');
    });

    test('sold-out variations are disabled when changing a cart line', async ({
        page,
    }) => {
        const stockEmail = uniqueEmail('cart-soldout');
        createVerifiedUser(stockEmail, 'Cart Sold Out E2E');
        await login(page, stockEmail);
        await addAjwa(page);

        await page.goto('/cart');
        await page
            .getByRole('button', { name: /Variation: Premium · 250g/ })
            .click();

        const picker = page.locator('dialog[open]');
        await expect(picker).toContainText('Change variation');
        await picker.getByText('Sukkari', { exact: true }).click();
        await expect(
            picker.getByRole('radio', { name: /500g/ }),
        ).toBeDisabled();
        await shot(page, 'cart-06-sold-out-variation');

        await page.keyboard.press('Escape');
        await expect(picker).toHaveCount(0);
    });
});
