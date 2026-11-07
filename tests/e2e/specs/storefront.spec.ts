import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { shot } from '../helpers';

const outputDir = process.env.E2E_OUTPUT_DIR ?? 'output';

/** Named element screenshot into output/screenshots/<project>/, light + dark. */
async function shotEl(
    page: Page,
    el: Locator,
    name: string,
): Promise<void> {
    const project = test.info().project.name;
    const dir = path.join(outputDir, 'screenshots', project);
    await mkdir(dir, { recursive: true });
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: path.join(dir, `${name}.png`) });
    await page.evaluate((d) => {
        document.documentElement.classList.toggle('dark', d);
        document.documentElement.style.colorScheme = d ? 'dark' : 'light';
    }, true);
    await page.waitForTimeout(120);
    await el.screenshot({ path: path.join(dir, `${name}-dark.png`) });
    await page.evaluate((d) => {
        document.documentElement.classList.toggle('dark', d);
        document.documentElement.style.colorScheme = d ? 'dark' : 'light';
    }, false);
}

const card = (page: Page, name: string) =>
    page.locator('article', { hasText: name }).first();

const catNav = (page: Page) => page.locator('nav[aria-label="Categories"]');

/** WCAG contrast ratio between two css colors ("rgb(r, g, b)"). */
function ratio(a: string, b: string): number {
    const lum = (c: string) => {
        const [r, g, bl] = c
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map((v) => {
                const s = Number(v) / 255;
                return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

const computed = (page: Page, sel: string, props: string[]) =>
    page.locator(sel).first().evaluate(
        (el, props) => {
            const cs = getComputedStyle(el);
            return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
        },
        props,
    );

test.describe('product card', () => {
    test('renders every state with the shared component', async ({ page }) => {
        await page.goto('/categories/dates-sweets');
        const ajwa = card(page, 'Ajwa dates 500g');
        await expect(ajwa).toBeVisible();
        await shot(page, 'card-00-grid');
        await shotEl(page, ajwa, 'card-02-discounted');

        // Price is the strongest text: larger than the title, weight 600-700.
        const price = ajwa.getByText(/^₱[\d.,]+$/).first();
        const title = ajwa.locator('h3 a');
        const [pp, tp] = await Promise.all([
            price.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight), color: cs.color };
            }),
            title.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) };
            }),
        ]);
        expect(pp.size).toBeGreaterThan(tp.size);
        expect(pp.weight).toBeGreaterThanOrEqual(600);
        expect(pp.weight).toBeLessThanOrEqual(700);

        // Frozen + halal, sold out.
        await page.goto('/categories/meat-seafood');
        const l = card(page, 'Halal-certified chicken longganisa');
        await expect(l).toBeVisible();
        await shotEl(page, l, 'card-03-frozen-halal');
        await expect(l.getByLabel(/Halal certified, verified by/)).toBeVisible();

        const oos = card(page, 'Halal-certified beef tapa');
        await expect(oos).toBeVisible();
        await shotEl(page, oos, 'card-04-sold-out');
        await expect(oos.getByText('Sold out')).toBeVisible();
        await expect(oos.getByText(/-\d+%/)).toHaveCount(0);

        // Regular card (no badges) + no halal badge on uncertified categories.
        await page.goto('/categories/books-quran');
        const quran = card(page, 'Qur’an with English translation');
        await expect(quran).toBeVisible();
        await shotEl(page, quran, 'card-01-regular');
        await expect(quran.getByLabel(/Halal certified/)).toHaveCount(0);

        await page.goto('/categories/modest-fashion');
        const malong = card(page, 'Handwoven Maranao malong, hand-stitched tapestry');
        await expect(malong).toBeVisible();
        await shotEl(page, malong, 'card-05-long-name');
        await expect(malong.getByLabel(/Halal certified/)).toHaveCount(0);
    });
});

test.describe('category nav', () => {
    test('no item is current on the home page', async ({ page }) => {
        await page.goto('/');
        await expect(catNav(page).locator('[aria-current="page"]')).toHaveCount(0);
    });

    test('active, hover and focus states use tokens', async ({ page }) => {
        await page.goto('/categories/dates-sweets');
        const active = catNav(page).getByRole('link', {
            name: 'Dates & Sweets',
        });
        await expect(active).toHaveAttribute('aria-current', 'page');

        // Active: brand-700 text + 2px brand-600 bottom indicator.
        const ind = await active.evaluate((el) => {
            const after = getComputedStyle(el, '::after');
            const cs = getComputedStyle(el);
            return {
                color: cs.color,
                fontWeight: cs.fontWeight,
                h: after.height,
                bg: after.backgroundColor,
            };
        });
        expect(ind.h).toBe('2px');
        expect(ind.fontWeight).toBe('500'); // weight must not change between states

        // Hover: brand-50 pill + brand-700 text.
        const other = catNav(page).getByRole('link', {
            name: 'Halal Food',
        });
        await other.hover();
        const hv = await other.evaluate((el) => {
            const cs = getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color, w: cs.fontWeight };
        });
        expect(hv.bg).toBe('rgb(234, 244, 237)');
        expect(hv.color).toBe('rgb(16, 69, 45)');
        expect(hv.w).toBe('500');

        // Keyboard: tab into the nav; the shared ring is 2px offset 2px.
        for (let i = 0; i < 20; i++) {
            const inNav = await page.evaluate(() =>
                document
                    .querySelector('nav[aria-label="Categories"]')
                    ?.contains(document.activeElement),
            );
            if (inNav) break;
            await page.keyboard.press('Tab');
        }
        const focused = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return null;
            const cs = getComputedStyle(el);
            return {
                inNav: !!el.closest('nav[aria-label="Categories"]'),
                w: cs.outlineWidth,
                style: cs.outlineStyle,
                offset: cs.outlineOffset,
            };
        });
        expect(focused?.inNav).toBe(true);
        expect(focused?.w).toBe('2px');
        expect(focused?.style).toBe('solid');
        expect(focused?.offset).toBe('2px');
        await shot(page, 'nav-01-states');
    });
});

test.describe('contrast', () => {
    for (const dark of [false, true]) {
        test(`price, old price, tag and nav text pass in ${dark ? 'dark' : 'light'}`, async ({
            page,
        }) => {
            await page.goto('/categories/dates-sweets');
            if (dark) {
                await page.evaluate(() => {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                });
            }
            const hexSurface = await page.evaluate(() => {
                const d = document.createElement('div');
                d.style.backgroundColor = 'var(--surface)';
                document.body.append(d);
                const c = getComputedStyle(d).backgroundColor;
                d.remove();
                return c;
            });

            const price = await computed(page, 'span[data-price]', ['color']);
            const was = await computed(page, 's[data-price]', ['color']);
            const navLink = catNav(page).getByRole('link').first();
            const navColor = await navLink.evaluate(
                (el) => getComputedStyle(el).color,
            );
            const tag = page
                .locator('article', { hasText: 'Ajwa dates 500g' })
                .getByText(/-\d+%/)
                .first();
            const tagColors = await tag.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { fg: cs.color, bg: cs.backgroundColor };
            });

            expect(ratio(price.color, hexSurface)).toBeGreaterThanOrEqual(4.5);
            expect(ratio(was.color, hexSurface)).toBeGreaterThanOrEqual(4.5);
            expect(ratio(navColor, hexSurface)).toBeGreaterThanOrEqual(4.5);
            expect(ratio(tagColors.fg, tagColors.bg)).toBeGreaterThanOrEqual(4.5);
        });
    }
});

test.describe('footer', () => {
    test('renders trust strip, groups and legal bar', async ({ page }) => {
        await page.goto('/');
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(
            footer.getByText(/Every halal claim is verified by/),
        ).toBeVisible();
        for (const t of ['COD', 'GCash', 'Maya', 'J&T Express']) {
            await expect(footer.getByText(t, { exact: true })).toBeVisible();
        }
        for (const h of ['Shop', 'Support', 'Halal & trust', 'Sell', 'Company']) {
            await expect(
                footer.getByRole('navigation', { name: h }),
            ).toBeAttached();
        }
        await expect(footer.getByText(/© \d{4}/)).toBeVisible();
        await shot(page, 'footer-01');
    });

    test('groups collapse into disclosures below 640px', async ({ page }) => {
        test.skip(
            test.info().project.name !== 'mobile-360',
            'accordion only below 640px',
        );
        await page.goto('/');
        const toggle = page
            .locator('footer')
            .getByRole('button', { name: 'Support' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(
            page.locator('footer').getByRole('link', { name: 'Track order' }),
        ).toBeVisible();
        await shot(page, 'footer-02-accordion');
    });
});
