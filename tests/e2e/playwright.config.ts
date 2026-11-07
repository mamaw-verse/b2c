import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost';
const outputDir = process.env.E2E_OUTPUT_DIR ?? 'output';

export default defineConfig({
    testDir: './specs',
    outputDir: `${outputDir}/artifacts`,
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ['list'],
        ['html', { outputFolder: `${outputDir}/report`, open: 'never' }],
        ['json', { outputFile: `${outputDir}/results.json` }],
    ],
    use: {
        baseURL,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'desktop-1280',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
            },
        },
        {
            name: 'tablet-768',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 768, height: 1024 },
            },
        },
        {
            name: 'mobile-360',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 360, height: 800 },
            },
        },
    ],
});
