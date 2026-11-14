import { test, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.E2E_OUTPUT_DIR ?? 'output';
const repoRoot = path.resolve(import.meta.dirname, '..', '..');

/**
 * Capture a named, full-page screenshot into output/screenshots/<project>/.
 * Names are stable across runs so agents and humans can diff or review them.
 * Also writes a `<name>-dark.png` variant with the `.dark` class applied the
 * same way use-appearance does (localStorage + documentElement class).
 */
export async function shot(page: Page, name: string): Promise<string> {
    const project = test.info().project.name;
    const dir = path.join(outputDir, 'screenshots', project);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    await setDark(page, true);
    await page.screenshot({
        path: path.join(dir, `${name}-dark.png`),
        fullPage: true,
    });
    await setDark(page, false);

    return file;
}

/** Toggle the app's class-based dark mode, mirroring applyTheme(). */
async function setDark(page: Page, dark: boolean): Promise<void> {
    await page.evaluate((d) => {
        localStorage.setItem('appearance', d ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', d);
        document.documentElement.style.colorScheme = d ? 'dark' : 'light';
    }, dark);
    // Let color transitions settle before capturing.
    await page.waitForTimeout(150);
}

/** Unique email per run so registrations never collide with existing users. */
export function uniqueEmail(prefix = 'e2e'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Create a verified user through Sail + artisan (password: "password").
 * Specs run against the dev database, so this seeds fixture users that
 * cannot be produced through the UI (verified routes block unverified
 * registrations, e.g. /seller/register).
 */
export function createVerifiedUser(email: string, name = 'E2E User'): void {
    const php = `App\\Models\\User::create(['name' => '${name}', 'email' => '${email}', 'password' => bcrypt('password')])->forceFill(['email_verified_at' => now()])->save();`;
    execSync(`vendor/bin/sail artisan tinker --execute "${php}"`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });
}

/**
 * Top up a seeded catalogue product's stock through Sail + artisan.
 * Checkouts decrement the finite seed stock, so repeated e2e runs would
 * eventually hit an out-of-stock product and disable "Add to cart".
 */
export function ensureProductStock(slug: string, stock = 999): void {
    const php = `App\\Models\\Product::where('slug', '${slug}')->update(['stock' => ${stock}]);`;
    execSync(`vendor/bin/sail artisan tinker --execute "${php}"`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });
}

/**
 * Clone the seeded video product (travel prayer mat) into a fresh published
 * listing so moderation specs can flag/hide it without breaking the shared
 * catalogue product other specs rely on. Returns nothing; the caller knows
 * the slug it passed in.
 */
export function seedProductWithVideo(name: string, slug: string): void {
    const php = `
        \\$src = App\\Models\\Product::where('slug', 'travel-prayer-mat-with-qibla-compass-and-pouch')->firstOrFail();
        \\$product = \\$src->replicate(['id', 'created_at', 'updated_at']);
        \\$product->name = '${name}';
        \\$product->slug = '${slug}';
        \\$product->published = true;
        \\$product->hidden = false;
        \\$product->save();
        foreach (\\$src->images as \\$image) {
            \\$copy = \\$image->replicate(['id', 'created_at', 'updated_at']);
            \\$copy->product_id = \\$product->id;
            \\$copy->save();
        }
    `;
    execSync(`vendor/bin/sail artisan tinker --execute "${php}"`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });
}

/**
 * Seed a pending payout request and an unprocessed customer refund for the
 * admin payables page (P-07). Returns the unique markers the spec uses to
 * locate the rows and the refund amount in centavos.
 */
export function seedPayablesFixtures(): {
    payoutAccountName: string;
    refundReason: string;
    refundAmount: number;
} {
    const stamp = Date.now();
    const payoutAccountName = `E2E Payout Admin ${stamp}`;
    const refundReason = `E2E payables refund ${stamp}`;
    const php = `
        \\$shop = App\\Models\\Shop::where('slug', 'barakah-pantry')->firstOrFail();
        App\\Models\\Payout::create([
            'shop_id' => \\$shop->id,
            'amount' => 15000,
            'status' => 'requested',
            'method' => 'GCash',
            'account_name' => '${payoutAccountName}',
            'account_number' => 'E2E-ACCT-778899',
        ]);
        \\$order = App\\Models\\Order::latest('created_at')->firstOrFail();
        App\\Models\\OrderRefund::create([
            'order_id' => \\$order->id,
            'amount' => 25000,
            'reason' => '${refundReason}',
            'resolved_by' => App\\Models\\User::where('email', 'admin@example.com')->value('id'),
        ]);
    `;
    execSync(`vendor/bin/sail artisan tinker --execute "${php}"`, {
        cwd: repoRoot,
        stdio: 'pipe',
    });

    return { payoutAccountName, refundReason, refundAmount: 25000 };
}

/** Log in through the real Fortify form and wait for the redirect away. */
export async function login(
    page: Page,
    email: string,
    password = 'password',
): Promise<void> {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
        timeout: 15_000,
    });
}

/** Inertia props of the currently rendered page (reads script[data-page]). */
export async function pageProps<T = Record<string, unknown>>(
    page: Page,
): Promise<T> {
    const raw = await page.evaluate(
        () => document.querySelector('script[data-page]')?.textContent ?? '{}',
    );
    return (JSON.parse(raw) as { props: T }).props;
}

type ApiResult<T = unknown> = { status: number; body: T };

/**
 * Call a web route from inside the page (session cookie + XSRF header),
 * so specs can seed state (cart items, addresses, reports) through the same
 * endpoints the UI uses instead of touching the database.
 */
export async function api<T = unknown>(
    page: Page,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: Record<string, unknown>,
): Promise<ApiResult<T>> {
    const result = await page.evaluate(
        async ([method, url, data]) => {
            const xsrf = document.cookie
                .split('; ')
                .find((c) => c.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            const res = await fetch(url, {
                method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(data && method !== 'GET'
                        ? { 'Content-Type': 'application/json' }
                        : {}),
                    ...(xsrf
                        ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) }
                        : {}),
                },
                ...(method !== 'GET' && data
                    ? { body: JSON.stringify(data) }
                    : {}),
            });
            const text = await res.text();
            let body: unknown = text;
            try {
                body = JSON.parse(text);
            } catch {
                // Redirects/Inertia responses come back as HTML.
            }
            return { status: res.status, body };
        },
        [method, url, data ?? null] as const,
    );

    if (result.status >= 400) {
        console.error(`[api] ${method} ${url} → ${result.status}`, result.body);
    }

    return result;
}
