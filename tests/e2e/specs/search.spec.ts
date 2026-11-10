import { expect, test } from '@playwright/test';
import { shot } from '../helpers';

test.describe('search', () => {
    test('shows results for a query', async ({ page }) => {
        await page.goto('/search?q=dates');

        await expect(page.locator('h1')).toContainText('dates');
        await expect(page.locator('#sr-grid article').first()).toBeVisible();
        await shot(page, 'search-01-results');
    });

    test('toggles the halal filter chip', async ({ page }) => {
        await page.goto('/search?q=dates');

        await page.getByRole('button', { name: 'Halal certified' }).click();

        await expect(page).toHaveURL(/halal=/);
        await expect(page.locator('#sr-grid article').first()).toBeVisible();
        await shot(page, 'search-02-halal-filter');
    });

    test('changes the sort order', async ({ page }) => {
        await page.goto('/search?q=dates');

        await page.selectOption('select[aria-label="Sort by"]', 'price_asc');

        await expect(page).toHaveURL(/sort=price_asc/);
        await shot(page, 'search-03-sorted');
    });

    test('shows an empty state when nothing matches', async ({ page }) => {
        await page.goto('/search?q=xyzzy-no-match-9999');

        await expect(page.getByText('No products match')).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Clear filters' }),
        ).toHaveAttribute('href', '/search');
        await shot(page, 'search-04-empty');
    });

    test('navigates from a result to the product page', async ({ page }) => {
        await page.goto('/search?q=dates');

        await page.locator('#sr-grid a[href*="/products/"]').first().click();

        await expect(page).toHaveURL(/\/products\/.+/);
        await shot(page, 'search-05-product-landed');
    });
});
