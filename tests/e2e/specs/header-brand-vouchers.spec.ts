import { expect, test } from '@playwright/test';

test.describe('Header Brand Placement, Voucher Cards & Brand Assets', () => {
    const viewports = [
        { width: 320, height: 600, name: 'mobile-320' },
        { width: 360, height: 800, name: 'mobile-360' },
        { width: 375, height: 667, name: 'mobile-375' },
        { width: 768, height: 1024, name: 'tablet-768' },
        { width: 820, height: 1180, name: 'tablet-820' },
        { width: 1024, height: 768, name: 'desktop-1024' },
        { width: 1280, height: 800, name: 'desktop-1280' },
    ];

    test('Meta tags, brand assets and page title', async ({ page }) => {
        await page.goto('/');

        // Title suffix "· HalalBenta"
        const title = await page.title();
        expect(title).toContain('· HalalBenta');

        // Theme color meta tag
        const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
        expect(themeColor).toBe('#17643c');

        // Manifest link
        const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
        expect(manifest).toBe('/manifest.webmanifest');

        // Apple touch icon link
        const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
        expect(appleIcon).toBe('/apple-touch-icon.png');

        // Open Graph & Twitter meta tags
        const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
        expect(ogImage).toContain('/brand/og-image.png');
        const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
        expect(twitterImage).toContain('/brand/og-image.png');

        // Favicon response checks
        const faviconResp = await page.request.get('/favicon.ico');
        expect(faviconResp.status()).toBe(200);
        const faviconSvgResp = await page.request.get('/favicon.svg');
        expect(faviconSvgResp.status()).toBe(200);
        const manifestResp = await page.request.get('/manifest.webmanifest');
        expect(manifestResp.status()).toBe(200);
        const manifestJson = await manifestResp.json();
        expect(manifestJson.theme_color).toBe('#17643c');
        expect(manifestJson.icons.length).toBeGreaterThanOrEqual(4);
    });

    test('Header brand placement on mobile (< 768px): uncollapsed and collapsed states', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await page.goto('/');

        // 1. Initial top state (scrollY = 0)
        const wordmarkLink = page.locator('header a[aria-label="HalalBenta home"]').first();
        await expect(wordmarkLink).toBeVisible();
        await expect(wordmarkLink).toHaveAttribute('href', '/');

        // Check wordmark img has alt="HalalBenta"
        const wordmarkImg = wordmarkLink.locator('img[alt="HalalBenta"]').first();
        await expect(wordmarkImg).toBeVisible();
        const wordmarkBox = await wordmarkImg.boundingBox();
        expect(wordmarkBox?.height).toBeCloseTo(28, 1);

        // Row 1 has cart and chat icon buttons
        const cartButton = page.locator('header a[aria-label^="Cart"]').first();
        const chatButton = page.locator('header a[aria-label^="Chat"]').first();
        await expect(cartButton).toBeVisible();
        await expect(chatButton).toBeVisible();

        // Row 2 has search field at full width
        const searchInput = page.getByPlaceholder('Search halal products');
        await expect(searchInput).toBeVisible();
        const initialSearchBox = await searchInput.boundingBox();
        expect(initialSearchBox?.width).toBeGreaterThanOrEqual(300);

        // 2. Scroll past 48px to trigger collapse
        await page.evaluate(() => window.scrollTo(0, 80));
        await page.waitForTimeout(300);

        // Square mark appears
        const squareMark = page.locator('header img[src*="halalbenta-mark.svg"]').first();
        await expect(squareMark).toBeVisible();
        // Decorative: alt="" and aria-hidden="true"
        await expect(squareMark).toHaveAttribute('alt', '');
        await expect(squareMark).toHaveAttribute('aria-hidden', 'true');

        const squareBox = await squareMark.boundingBox();
        expect(squareBox?.width).toBeCloseTo(32, 1);
        expect(squareBox?.height).toBeCloseTo(32, 1);

        // Tap target is >= 44px
        const squareLink = squareMark.locator('..');
        const squareLinkBox = await squareLink.boundingBox();
        expect(squareLinkBox?.width).toBeGreaterThanOrEqual(44);
        expect(squareLinkBox?.height).toBeGreaterThanOrEqual(44);

        // Search field is at least 200px wide on 360px screen
        const collapsedSearchBox = await searchInput.boundingBox();
        expect(collapsedSearchBox?.width).toBeGreaterThanOrEqual(200);

        // Clicking logo scrolls to top when already on homepage
        await squareLink.click();
        await page.waitForTimeout(400);
        const currentScrollY = await page.evaluate(() => window.scrollY);
        expect(currentScrollY).toBeLessThan(10);
    });

    test('Header brand placement on tablet (768px - 1023px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        // Wordmark is visible (h=28-32px)
        const wordmarkImg = page.locator('header img[alt="HalalBenta"]').first();
        await expect(wordmarkImg).toBeVisible();
        const wordmarkBox = await wordmarkImg.boundingBox();
        expect(wordmarkBox?.height).toBeGreaterThanOrEqual(28);
        expect(wordmarkBox?.height).toBeLessThanOrEqual(34);

        // Search field is flex-1
        const searchInput = page.getByPlaceholder('Search halal products');
        await expect(searchInput).toBeVisible();
        const searchBox = await searchInput.boundingBox();
        expect(searchBox?.width).toBeGreaterThanOrEqual(320);

        // Scroll does not collapse tablet header
        await page.evaluate(() => window.scrollTo(0, 100));
        await page.waitForTimeout(200);
        await expect(wordmarkImg).toBeVisible();
    });

    test('Voucher cards responsive layout, anatomy and overflow check', async ({ page }) => {
        for (const vp of viewports) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto('/');

            const vouchersSection = page.locator('section[aria-labelledby="home-vouch"]');
            await expect(vouchersSection).toBeVisible();

            const voucherList = vouchersSection.locator('ul');
            const voucherItems = voucherList.locator('> li');
            const count = await voucherItems.count();
            expect(count).toBeGreaterThanOrEqual(2);

            // Verify no horizontal overflow on page
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
            expect(scrollWidth, `No page horizontal overflow at ${vp.width}px`).toBeLessThanOrEqual(clientWidth);

            // Card Anatomy for each voucher card
            for (let i = 0; i < count; i++) {
                const item = voucherItems.nth(i);
                // Left color tab with icon and label ("Platform" or "Shop")
                const colorTab = item.locator('div').first().locator('> div').first();
                const tabText = await colorTab.innerText();
                expect(['Platform', 'Shop', 'Shipping']).toContain(tabText.trim());

                // Content block: title on one line (truncate), subtitle on one line (truncate)
                const titleEl = item.locator('p.text-label');
                await expect(titleEl).toHaveClass(/truncate/);
                const subtitleEl = item.locator('p.text-caption');
                await expect(subtitleEl).toHaveClass(/truncate/);

                // Claim button on the right with min-width 72px
                const claimButton = item.locator('button, [role="button"], span.btn').first();
                const btnBox = await claimButton.boundingBox();
                expect(btnBox?.width).toBeGreaterThanOrEqual(72);
            }

            // Viewport-specific layout checks
            if (vp.width < 768) {
                // sm: horizontal snap scroller, each card ~85% width
                const listClasses = await voucherList.getAttribute('class');
                expect(listClasses).toContain('snap-x');
                expect(listClasses).toContain('snap-mandatory');

                const firstItemBox = await voucherItems.first().boundingBox();
                expect(firstItemBox?.width).toBeCloseTo(vp.width * 0.85, 20);
            } else if (vp.width >= 768 && vp.width < 1024) {
                // md: 2-column grid or snap scroller calc(50% - 8px)
                const firstItemBox = await voucherItems.nth(0).boundingBox();
                const secondItemBox = await voucherItems.nth(1).boundingBox();
                // Equal width and equal height
                expect(firstItemBox?.width).toBeCloseTo(secondItemBox?.width ?? 0, 2);
                expect(firstItemBox?.height).toBeCloseTo(secondItemBox?.height ?? 0, 2);
            } else {
                // lg: 3 or 4 columns, equal width and height
                const firstItemBox = await voucherItems.nth(0).boundingBox();
                const secondItemBox = await voucherItems.nth(1).boundingBox();
                expect(firstItemBox?.width).toBeCloseTo(secondItemBox?.width ?? 0, 2);
                expect(firstItemBox?.height).toBeCloseTo(secondItemBox?.height ?? 0, 2);
            }
        }
    });

    test('Dark mode logo contrast and accessibility', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        });

        // Dark mode wordmark is visible
        const darkWordmark = page.locator('header img[src*="halalbenta-wordmark-dark.svg"]').first();
        await expect(darkWordmark).toBeVisible();

        // Mobile scrolled dark mark
        await page.setViewportSize({ width: 360, height: 800 });
        await page.evaluate(() => window.scrollTo(0, 80));
        await page.waitForTimeout(300);

        const darkSquareMark = page.locator('header img[src*="halalbenta-mark-dark.svg"]').first();
        await expect(darkSquareMark).toBeVisible();
    });
});
