import { expect, test } from '@playwright/test';
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
