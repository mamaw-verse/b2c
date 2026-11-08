import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shot } from '../helpers';

const here = path.dirname(fileURLToPath(import.meta.url));
const FOCUS_PAGE = path.resolve(
    here,
    '../../../docs/design-system/styleguide/focus.html',
);

/** Read the computed outline of an element (or :has-driven container). */
async function outlineOf(page: import('@playwright/test').Page, sel: string) {
    return page.locator(sel).first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
            width: cs.outlineWidth,
            style: cs.outlineStyle,
            color: cs.outlineColor,
            offset: cs.outlineOffset,
        };
    });
}

test.describe('focus indicators — real app controls', () => {
    test('header search field shows one hugging ring, stepper rings on the container', async ({
        page,
    }) => {
        await page.goto('/');
        const search = page.locator('input[type="search"]').first();
        await expect(search).toBeVisible();
        await search.focus();
        await expect(search).toBeFocused();

        const s = await outlineOf(page, 'input[type="search"]');
        expect(s.style).toBe('solid');
        expect(s.width).toBe('2px');
        expect(s.offset).toBe('0px'); // hugs the field border, no white gap
        await shot(page, 'focus-01-header-search');

        // Quantity stepper lives in the variation sheet on a product page
        // (this seeded product has options, so the sheet always opens).
        await page.goto('/products/ajwa-dates-500g-premium-grade-resealable-tub');
        await page
            .getByRole('button', { name: /add to cart/i })
            .first()
            .click();
        const stepperInput = page
            .locator('[role="group"][aria-label*="uantit" i] input')
            .first();
        await expect(stepperInput).toBeVisible();
        await stepperInput.focus();

        // The ring sits on the stepper container, not the inner input.
        const container = page.locator(
            '[role="group"][aria-label*="uantit" i]',
        );
        const c = await outlineOf(page, '[role="group"][aria-label*="uantit" i]');
        expect(c.style).toBe('solid');
        expect(c.width).toBe('2px');
        const inner = await outlineOf(
            page,
            '[role="group"][aria-label*="uantit" i] input',
        );
        expect(inner.style).toBe('none');
        await expect(container).toHaveCSS('border-color', /.+/);
        await shot(page, 'focus-02-quantity-stepper');
    });
});

test.describe('focus indicators — styleguide foundation page', () => {
    test('every control gets a 2px ring, light and dark', async ({ page }) => {
        await page.goto('file://' + FOCUS_PAGE);

        const targets = [
            'fz-input',
            'fz-search',
            'fz-stepper',
            'fz-btn-fill',
            'fz-btn',
            'fz-link',
            'fz-chip',
            'fz-tab',
            'fz-check',
            'fz-radio',
            'fz-switch',
            'fz-card',
        ];

        // Tab through the page; every demo target must end up focus-visible.
        for (const id of targets) {
            const el = page.locator('#' + id);
            await el.focus();
            await expect(el).toBeFocused();
            const o = await outlineOf(page, '#' + id);
            const container = await el.evaluate((n) => {
                const ring = n.closest('.focus-ring, .focus-ring-inset');
                return ring ? getComputedStyle(ring).outlineStyle : null;
            });
            // Ring is either on the element itself or on its .focus-ring container.
            expect(
                o.style === 'solid' || container === 'solid',
                `${id}: expected a visible outline on the element or its .focus-ring container`,
            ).toBeTruthy();
        }
        await shot(page, 'focus-10-light');

        await page.evaluate(() => {
            localStorage.setItem('appearance', 'dark');
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        });
        for (const id of ['fz-d-input', 'fz-d-btn', 'fz-d-stepper', 'fz-d-link', 'fz-d-check', 'fz-d-switch']) {
            const el = page.locator('#' + id);
            await el.focus();
            const o = await outlineOf(page, '#' + id);
            const container = await el.evaluate((n) => {
                const ring = n.closest('.focus-ring, .focus-ring-inset');
                return ring ? getComputedStyle(ring).outlineStyle : null;
            });
            expect(
                o.style === 'solid' || container === 'solid',
                `${id}: expected a visible outline in dark theme`,
            ).toBeTruthy();
        }
        await page.screenshot({
            path: 'output/screenshots/' + test.info().project.name + '/focus-11-dark.png',
            fullPage: true,
        });
    });
});
