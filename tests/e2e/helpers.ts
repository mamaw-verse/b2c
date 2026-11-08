import { test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.E2E_OUTPUT_DIR ?? 'output';

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
        () =>
            document.querySelector('script[data-page]')?.textContent ?? '{}',
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
                    ...(data ? { 'Content-Type': 'application/json' } : {}),
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                body: data ? JSON.stringify(data) : undefined,
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
