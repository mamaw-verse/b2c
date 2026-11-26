import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import {
    createVerifiedUser,
    login,
    pageProps,
    seedPhp,
    shot,
    uniqueEmail,
} from '../helpers';

/**
 * docs/planning/15-blog.md B5.1: invitation to reading, end to end.
 *
 * Needs `BLOG_ENABLED=true` on the app under test (the blog ships dark), so the
 * whole file skips itself when `/blog` answers 404. Uses the seeded admin
 * (`admin@example.com`) and the seeded catalogue for the product embed.
 */
const ADMIN = 'admin@example.com';
const fixture = (name: string) =>
    path.resolve(import.meta.dirname, '..', 'fixtures', name);

const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const EDITOR_EMAIL = uniqueEmail('e2e-editor');
const AUTHOR_NAME = `E2E Guest Author ${stamp}`;
const POST_TITLE = `E2E Halal Pantry Guide ${stamp}`;
const SEARCH_TERM = `pantryguide${stamp}`;

let authorSlug = '';
let postSlug = '';
let postEditUrl = '';
let productSlug = '';

function bodyMarkdown(): string {
    const paragraph =
        'A well stocked halal pantry starts with a short list of staples you ' +
        'actually use every week, from rice and cooking oil to spices and ' +
        'sauces. Check the certification on every label and keep receipts for ' +
        'items you buy in bulk so you can compare prices later.';

    return [
        `Everything you need to stock a halal pantry, ${SEARCH_TERM}.`,
        '',
        '## Start with staples',
        '',
        paragraph,
        '',
        paragraph,
        '',
        '## Shop the essentials',
        '',
        `[[product:${productSlug}]]`,
        '',
        paragraph,
        '',
        '## Keep it fresh',
        '',
        paragraph,
        '',
        paragraph,
    ].join('\n');
}

/** Upload one image through the post form's dialog. */
async function uploadImage(
    page: Page,
    trigger: ReturnType<Page['getByRole']>,
    file: string,
    alt: string,
): Promise<void> {
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="file"]').setInputFiles(fixture(file));
    await dialog.getByLabel('Alt text').fill(alt);
    await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
}

test.describe.serial('blog — invitation to reading', () => {
    test.beforeAll(async ({ request }) => {
        const response = await request.get('/blog', { maxRedirects: 0 });
        test.skip(
            response.status() === 404,
            'Blog is disabled: run the app with BLOG_ENABLED=true',
        );

        const seeded = seedPhp<{ product: string; author: string }>(`
            Artisan::call('db:seed', ['--class' => 'BlogBaselineSeeder', '--force' => true]);
            $author = App\\Models\\BlogAuthor::query()->forceCreate([
                'display_name' => '${AUTHOR_NAME}',
                'slug' => Illuminate\\Support\\Str::slug('${AUTHOR_NAME}'),
                'bio' => 'Guest contributor created by the e2e suite.',
                'is_house' => false,
                'is_active' => true,
                'consent_confirmed_at' => now(),
                'consent_version' => 'e2e',
            ]);

            return [
                'product' => App\\Models\\Product::query()->orderBy('created_at')->value('slug'),
                'author' => $author->slug,
            ];
        `);
        productSlug = seeded.product;
        authorSlug = seeded.author;
        expect(productSlug, 'needs a seeded catalogue product').toBeTruthy();
    });

    test('admin invites an editor', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto('/admin/blog/editors');
        await page.locator('input[name="email"]').fill(EDITOR_EMAIL);
        await page.getByRole('button', { name: 'Send invitation' }).click();

        await expect(page.getByText(EDITOR_EMAIL).first()).toBeVisible();
        await shot(page, 'blog-01-editor-invited');
    });

    test('the invitee accepts and becomes an editor', async ({ page }) => {
        const invitationId = seedPhp<string>(`
            return App\\Models\\BlogEditorInvitation::query()
                ->whereRaw('LOWER(email) = ?', ['${EDITOR_EMAIL.toLowerCase()}'])
                ->latest('created_at')
                ->value('id');
        `);
        expect(invitationId).toBeTruthy();

        createVerifiedUser(EDITOR_EMAIL, 'E2E Editor');
        await login(page, EDITOR_EMAIL);
        await page.goto(`/editor-invitations/${invitationId}`);
        await shot(page, 'blog-02-invitation');

        await page.locator('input[name="consent"]').check();
        await page.getByRole('button', { name: 'Accept invitation' }).click();

        await page.waitForURL('**/admin/blog/posts');
        await shot(page, 'blog-03-editor-posts');
    });

    test('the editor writes a post on behalf of another author', async ({
        page,
    }) => {
        await login(page, EDITOR_EMAIL);
        await page.goto('/admin/blog/posts/create');

        await page.getByLabel('Title', { exact: true }).fill(POST_TITLE);
        await page.getByLabel('Category', { exact: true }).selectOption({
            index: 0,
        });
        await page
            .getByLabel('Author (write on behalf of)')
            .selectOption({ label: AUTHOR_NAME });
        await page
            .getByLabel('Excerpt')
            .fill(
                'A practical guide to stocking a halal pantry, with shoppable essentials.',
            );

        await uploadImage(
            page,
            page.getByRole('button', { name: 'Upload', exact: true }).first(),
            'blog-cover.png',
            'Green banner for the halal pantry guide',
        );
        await uploadImage(
            page,
            page.getByRole('button', { name: 'Upload', exact: true }).first(),
            'blog-thumbnail.png',
            'Green square thumbnail',
        );

        await page.locator('#body').fill(bodyMarkdown());
        await page.getByRole('button', { name: 'Insert image' }).click();
        const dialog = page.getByRole('dialog');
        await dialog
            .locator('input[type="file"]')
            .setInputFiles(fixture('blog-body.png'));
        await dialog.getByLabel('Alt text').fill('Pantry shelf illustration');
        await dialog
            .getByRole('button', { name: 'Upload', exact: true })
            .click();
        await expect(dialog).toBeHidden({ timeout: 20_000 });
        await shot(page, 'blog-04-post-form');

        await page.getByRole('button', { name: 'Save draft' }).click();
        await page.waitForURL(/\/admin\/blog\/posts\/[^/]+\/edit/);
        postEditUrl = new URL(page.url()).pathname;

        const props = await pageProps<{ post: { slug: string } }>(page);
        postSlug = props.post.slug;
        expect(postSlug).toBeTruthy();
    });

    test('a draft is hidden from the public', async ({ browser }) => {
        const context = await browser.newContext();
        const anon = await context.newPage();
        const response = await anon.goto(`/blog/${postSlug}`);
        expect(response?.status()).toBe(404);
        await context.close();
    });

    test('the editor publishes and cannot open the admin dashboard', async ({
        page,
    }) => {
        await login(page, EDITOR_EMAIL);
        await page.goto(postEditUrl);
        await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled(
            { timeout: 15_000 },
        );
        await page.getByRole('button', { name: 'Publish' }).click();
        await expect(
            page.getByRole('button', { name: 'Unpublish' }),
        ).toBeVisible();
        await shot(page, 'blog-05-published');

        const dashboard = await page.goto('/admin/dashboard');
        expect(dashboard?.status()).toBe(404);
    });

    test('an admin features the post', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto(postEditUrl);
        const featured = page.getByLabel('Featured on the blog hero');
        await featured.check();
        await expect(featured).toBeChecked();
    });

    test('readers can find the post on the public blog', async ({
        browser,
    }) => {
        const context = await browser.newContext();
        const reader = await context.newPage();

        await reader.goto('/blog');
        await expect(
            reader.getByRole('link', { name: POST_TITLE }).first(),
        ).toBeVisible();
        await shot(reader, 'blog-06-index');

        await reader.goto(`/blog?q=${SEARCH_TERM}`);
        await expect(
            reader.getByRole('link', { name: POST_TITLE }).first(),
        ).toBeVisible();

        await reader.goto(`/blog/author/${authorSlug}`);
        await expect(
            reader.getByRole('heading', { name: AUTHOR_NAME }),
        ).toBeVisible();
        await expect(
            reader.getByRole('link', { name: POST_TITLE }).first(),
        ).toBeVisible();
        await shot(reader, 'blog-07-author');

        await reader.goto(`/blog/${postSlug}`);
        await expect(
            reader.getByRole('heading', { level: 1, name: POST_TITLE }),
        ).toBeVisible();
        await expect(
            reader.locator(`a[href*="/products/${productSlug}"]`).first(),
        ).toBeVisible();
        await shot(reader, 'blog-08-post');

        // The category page lists the post too (first category is the one picked).
        const categoryHref = await reader
            .locator('a[href*="/blog/category/"]')
            .first()
            .getAttribute('href');
        expect(categoryHref).toBeTruthy();
        await reader.goto(categoryHref as string);
        await expect(
            reader.getByRole('link', { name: POST_TITLE }).first(),
        ).toBeVisible();

        await context.close();
    });
});
