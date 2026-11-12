import { expect, test } from '@playwright/test';
import { login, shot } from '../helpers';

const SHOP = '/shops/barakah-pantry';
const BUYER = 'test@example.com';
const SELLER = 'seller@example.com';
const ADMIN = 'admin@example.com';

const header = (page: import('@playwright/test').Page) =>
    page.locator('section[aria-labelledby="shop-name"]');

test.describe('shop page', () => {
    test('guest is sent to login when following', async ({ page }) => {
        await page.goto(SHOP);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await shot(page, 'shop-01-guest');

        await header(page)
            .getByRole('button', { name: 'Follow', exact: true })
            .click();
        await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    });

    test('buyer follows and unfollows the shop', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(SHOP);

        const follow = header(page).getByRole('button', {
            name: 'Follow',
            exact: true,
        });
        const following = header(page).getByRole('button', {
            name: 'Following',
            exact: true,
        });
        // Wait for the header actions, then normalize any leftover state
        // from a previously failed run.
        await expect(header(page).getByRole('button').first()).toBeVisible();
        if (await following.isVisible()) {
            await following.click();
            await expect(follow).toBeVisible({ timeout: 15_000 });
        }
        await expect(follow).toBeVisible();
        await shot(page, 'shop-02-follow');

        await follow.click();
        await expect(following).toBeVisible({ timeout: 15_000 });

        // The follow persists server-side across a fresh page load.
        await page.reload();
        await expect(
            header(page).getByRole('button', {
                name: 'Following',
                exact: true,
            }),
        ).toBeVisible();

        await header(page)
            .getByRole('button', { name: 'Following', exact: true })
            .click();
        await expect(follow).toBeVisible({ timeout: 15_000 });

        await page.reload();
        await expect(follow).toBeVisible();
        await shot(page, 'shop-03-unfollowed');
    });

    test('buyer can start a chat with the shop', async ({ page }) => {
        await login(page, BUYER);
        await page.goto(SHOP);

        await header(page)
            .getByRole('button', { name: 'Chat', exact: true })
            .click();
        await expect(page).toHaveURL(/\/account\/chat\/.+/, {
            timeout: 15_000,
        });
        await shot(page, 'shop-04-chat');
    });

    test('admin does not see follow or chat', async ({ page }) => {
        await login(page, ADMIN);
        await page.goto(SHOP);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(
            header(page).getByRole('button', { name: 'Follow' }),
        ).toHaveCount(0);
        await expect(
            header(page).getByRole('button', { name: 'Chat' }),
        ).toHaveCount(0);
        await shot(page, 'shop-05-admin');
    });

    test('the shop owner does not see follow or chat', async ({ page }) => {
        await login(page, SELLER);
        await page.goto(SHOP);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(
            header(page).getByRole('button', { name: 'Follow' }),
        ).toHaveCount(0);
        await expect(
            header(page).getByRole('button', { name: 'Chat' }),
        ).toHaveCount(0);
        await shot(page, 'shop-06-owner');
    });
});
