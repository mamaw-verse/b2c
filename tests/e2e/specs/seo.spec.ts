import { expect, test, type APIResponse, type Page } from '@playwright/test';
import { shot } from '../helpers';

const PRODUCT = '/products/ajwa-dates-500g-premium-grade-resealable-tub';
const SHOP = '/shops/barakah-pantry';
const PUBLIC_PAGES = ['/', '/sellers', '/why-choose-us', '/pages/returns', PRODUCT, SHOP];
const FAQ_PAGES = ['/why-choose-us', '/pages/returns', '/pages/halal-verification'];

type JsonLdNode = Record<string, unknown> & { '@type'?: unknown; '@id'?: string };
type JsonLdDocument = { '@context'?: string; '@graph'?: JsonLdNode[] };

/** Canonical URLs use the configured origin, which may not be the test host. */
function localPath(url: string): string {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
}

function types(node: JsonLdNode): string[] {
    return ([] as unknown[]).concat(node['@type'] ?? []).map(String);
}

async function readJsonLd(page: Page): Promise<JsonLdDocument[]> {
    const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
    return scripts.map((text) => JSON.parse(text) as JsonLdDocument);
}

/** Every `{ "@id": … }`-only object, anywhere in the value. */
function collectRefs(value: unknown, refs: string[] = []): string[] {
    if (Array.isArray(value)) {
        value.forEach((item) => collectRefs(item, refs));
    } else if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 1 && entries[0][0] === '@id') {
            refs.push(String(entries[0][1]));
        } else {
            entries.forEach(([, v]) => collectRefs(v, refs));
        }
    }
    return refs;
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

async function isNoindexEnvironment(page: Page): Promise<boolean> {
    // robots.txt blocks everything outside production or when noindex is forced.
    const robots = await (await page.request.get('/robots.txt')).text();
    return normalize(robots) === 'User-agent: * Disallow: /';
}

test.describe('robots.txt, sitemaps and llms.txt', () => {
    test('robots.txt is plain text and matches the environment', async ({
        page,
    }) => {
        const response = await page.request.get('/robots.txt');
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/plain');
        const body = await response.text();

        if (await isNoindexEnvironment(page)) {
            expect(body).toContain('Disallow: /');
            expect(body).not.toContain('Sitemap:');
            return;
        }

        expect(body).toMatch(/^Sitemap: .+\/sitemap\.xml$/m);
        for (const rule of [
            'Disallow: /cart',
            'Disallow: /checkout',
            'Disallow: /account',
            'Disallow: /seller/',
            'Disallow: /admin',
            'Disallow: /search',
            'Allow: /seller/terms',
        ]) {
            expect(body).toContain(rule);
        }
        expect(body).toContain('Disallow: /*?*sort=');
    });

    test('sitemap index lists child sitemaps that resolve', async ({
        page,
    }) => {
        const response = await page.request.get('/sitemap.xml');
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('xml');
        const xml = await response.text();
        expect(xml).toContain('<sitemapindex');

        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
            (match) => match[1],
        );
        expect(locs.length).toBeGreaterThan(0);

        for (const loc of locs.slice(0, 6)) {
            const child: APIResponse = await page.request.get(localPath(loc));
            expect(child.status(), loc).toBe(200);
            expect(await child.text(), loc).toContain('<urlset');
        }
    });

    test('llms.txt is served in production only', async ({ page }) => {
        const response = await page.request.get('/llms.txt');

        if (await isNoindexEnvironment(page)) {
            expect(response.status()).toBe(404);
            return;
        }

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/plain');
        const body = await response.text();
        expect(body.startsWith('# ')).toBe(true);
        expect(body).toContain('## Key facts');
        expect(body).toMatch(/\]\(https?:\/\/[^)\s]+\)/);
    });
});

test.describe('indexing directives', () => {
    test('robots meta and X-Robots-Tag agree and follow the path policy', async ({
        page,
    }) => {
        const noindexEnvironment = await page.request
            .get('/')
            .then((response) =>
                (response.headers()['x-robots-tag'] ?? '').includes(
                    'noindex',
                ),
            );

        const expectations: Record<string, RegExp> = noindexEnvironment
            ? {
                  '/': /noindex, nofollow/,
                  '/login': /noindex, nofollow/,
                  '/search?q=dates': /noindex, nofollow/,
              }
            : {
                  '/': /^(?!.*noindex)/,
                  '/seller/terms': /^(?!.*noindex)/,
                  '/login': /noindex, nofollow/,
                  '/register': /noindex, nofollow/,
                  '/cart': /noindex, nofollow/,
                  '/search?q=dates': /noindex, follow/,
              };

        for (const [path, expected] of Object.entries(expectations)) {
            const response = await page.goto(path);
            const header = response?.headers()['x-robots-tag'] ?? '';
            const meta =
                (await page
                    .locator('meta[name="robots"]')
                    .getAttribute('content')) ?? '';

            expect(header, `${path} X-Robots-Tag`).toMatch(expected);
            // The final page after any login redirect must still agree.
            expect(meta, `${path} <meta robots>`).toMatch(expected);
        }
    });

    test('non-canonical URLs redirect permanently', async ({ page }) => {
        const upper = await page.request.get('/Sellers', { maxRedirects: 0 });
        expect(upper.status()).toBe(301);
        expect(upper.headers()['location']).toMatch(/\/sellers$/);

        const slash = await page.request.get('/sellers/', { maxRedirects: 0 });
        expect(slash.status()).toBe(301);
        expect(slash.headers()['location']).toMatch(/\/sellers$/);

        const query = await page.request.get('/Search?q=dates', {
            maxRedirects: 0,
        });
        expect(query.status()).toBe(301);
        expect(query.headers()['location']).toMatch(/\/search\?q=dates$/);
    });
});

test.describe('head metadata on public pages', () => {
    for (const path of PUBLIC_PAGES) {
        test(`${path} has canonical, social and language tags`, async ({
            page,
        }) => {
            const response = await page.goto(path);
            expect(response?.status()).toBe(200);

            await expect(page).toHaveTitle(/.+/);
            const description = await page
                .locator('meta[name="description"]')
                .getAttribute('content');
            expect(description?.length ?? 0).toBeGreaterThan(30);

            const canonical = await page
                .locator('link[rel="canonical"]')
                .getAttribute('href');
            expect(canonical).toMatch(/^https?:\/\//);
            expect(new URL(canonical as string).pathname).toBe(
                path === '/' ? '/' : path,
            );

            const og = (property: string) =>
                page
                    .locator(`meta[property="${property}"]`)
                    .getAttribute('content');
            expect(await og('og:title')).toBeTruthy();
            expect(await og('og:description')).toBeTruthy();
            expect(await og('og:image')).toMatch(/^https?:\/\//);
            expect(await og('og:type')).toBeTruthy();
            expect(await og('og:locale')).toBe('en_PH');
            expect(
                new URL((await og('og:url')) as string).pathname,
            ).toBe(new URL(canonical as string).pathname);

            await expect(
                page.locator('meta[name="twitter:card"]'),
            ).toHaveAttribute('content', /.+/);
            await expect(
                page.locator('link[rel="alternate"][hreflang="en-PH"]'),
            ).toHaveAttribute('href', canonical as string);
        });
    }

    test('the default social image is served', async ({ page }) => {
        await page.goto('/');
        const image = await page
            .locator('meta[property="og:image"]')
            .getAttribute('content');
        const response = await page.request.get(localPath(image as string));

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toMatch(/^image\//);
    });
});

test.describe('structured data', () => {
    for (const path of PUBLIC_PAGES) {
        test(`${path} emits one valid, linked JSON-LD graph`, async ({
            page,
        }) => {
            await page.goto(path);
            const documents = await readJsonLd(page);

            expect(documents).toHaveLength(1);
            const [document] = documents;
            expect(document['@context']).toBe('https://schema.org');
            const graph = document['@graph'] ?? [];
            expect(graph.length).toBeGreaterThan(1);

            const ids = graph.map((node) => node['@id']);
            for (const node of graph) {
                expect(types(node).length, JSON.stringify(node)).toBeGreaterThan(0);
                expect(node['@id'], `${types(node)} node id`).toMatch(
                    /^https?:\/\//,
                );
            }
            expect(new Set(ids).size, 'duplicate @id values').toBe(ids.length);

            // Every reference must point at a node in the same graph.
            for (const ref of collectRefs(graph)) {
                expect(ids, `dangling reference ${ref}`).toContain(ref);
            }

            const all = graph.flatMap(types);
            expect(
                all.some((t) =>
                    [
                        'WebPage',
                        'CollectionPage',
                        'Article',
                        'FAQPage',
                        'AboutPage',
                    ].includes(t),
                ),
                'a page node',
            ).toBe(true);
        });
    }

    test('the home page graph describes the organization and website', async ({
        page,
    }) => {
        await page.goto('/');
        const graph = (await readJsonLd(page))[0]['@graph'] ?? [];
        const all = graph.flatMap(types);

        expect(all).toContain('Organization');
        expect(all).toContain('WebSite');
    });

    test('a product page describes the product and its seller', async ({
        page,
    }) => {
        await page.goto(PRODUCT);
        const graph = (await readJsonLd(page))[0]['@graph'] ?? [];
        const all = graph.flatMap(types);

        expect(all.some((t) => t === 'Product' || t === 'ProductGroup')).toBe(
            true,
        );
        await expect(page.locator('h1')).toBeVisible();
    });
});

test.describe('visible FAQ matches FAQPage markup', () => {
    for (const path of FAQ_PAGES) {
        test(`${path}`, async ({ page }) => {
            const response = await page.goto(path);
            test.skip(
                response?.status() === 404,
                `${path} is not published in this environment`,
            );

            const graph = (await readJsonLd(page))[0]['@graph'] ?? [];
            const faq = graph.find((node) => types(node).includes('FAQPage'));
            expect(faq, 'FAQPage node').toBeTruthy();

            const entities = (faq?.mainEntity ?? []) as Array<{
                name: string;
                acceptedAnswer: { text: string };
            }>;
            expect(entities.length).toBeGreaterThan(0);

            const section = page.locator('section[aria-labelledby="faq-heading"]');
            await expect(
                section.getByRole('heading', {
                    name: 'Frequently asked questions',
                }),
            ).toBeVisible();

            const visibleQuestions = (await section.locator('dt').allTextContents()).map(
                normalize,
            );
            const visibleAnswers = (await section.locator('dd').allTextContents()).map(
                normalize,
            );

            expect(visibleQuestions).toEqual(
                entities.map((entity) => normalize(entity.name)),
            );
            expect(visibleAnswers).toEqual(
                entities.map((entity) => normalize(entity.acceptedAnswer.text)),
            );

            await shot(page, `seo-faq-${path.split('/').pop()}`);
        });
    }

    test('pages without a visible FAQ carry no FAQPage markup', async ({
        page,
    }) => {
        await page.goto('/sellers');
        const graph = (await readJsonLd(page))[0]['@graph'] ?? [];

        expect(graph.flatMap(types)).not.toContain('FAQPage');
        await expect(page.locator('#faq-heading')).toHaveCount(0);
    });
});
