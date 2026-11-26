import { expect, test } from '@playwright/test';
import { login, seedPhp, shot } from '../helpers';

type Fixture = {
    conversationId: string;
    customerName: string;
    customerEmail: string;
    shopName: string;
    buyerText: string;
    sellerText: string;
};

let fixture: Fixture;

/**
 * A conversation between a new customer and the seeded Barakah Pantry shop,
 * with one message from each side. Chat history cannot be created through
 * the UI without two live sessions, so it is seeded.
 */
function seedConversation(stamp: number): Fixture {
    return seedPhp<Fixture>(`
        $stamp = '${stamp}';
        $shop = \\App\\Models\\Shop::where('slug', 'barakah-pantry')->firstOrFail();
        $seller = \\App\\Models\\User::where('email', 'seller@example.com')->firstOrFail();

        $customer = \\App\\Models\\User::factory()->create([
            'name' => 'Fatima Chatwell ' . $stamp,
            'email' => 'e2e-chat-' . $stamp . '@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        $conversation = \\App\\Models\\Conversation::create([
            'user_id' => $customer->id,
            'shop_id' => $shop->id,
            'last_message_at' => now(),
        ]);

        $buyerText = 'E2E hello from the customer ' . $stamp;
        $sellerText = 'E2E reply from the shop ' . $stamp;

        \\App\\Models\\Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $customer->id,
            'sender_role' => \\App\\Enums\\MessageSenderRole::Buyer,
            'type' => \\App\\Enums\\MessageType::Text,
            'body' => $buyerText,
        ]);
        \\App\\Models\\Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $seller->id,
            'sender_role' => \\App\\Enums\\MessageSenderRole::Seller,
            'type' => \\App\\Enums\\MessageType::Text,
            'body' => $sellerText,
        ]);

        return [
            'conversationId' => $conversation->id,
            'customerName' => $customer->name,
            'customerEmail' => $customer->email,
            'shopName' => $shop->name,
            'buyerText' => $buyerText,
            'sellerText' => $sellerText,
        ];
    `);
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
    fixture = seedConversation(Date.now());
});

test.describe('seller chat', () => {
    test('the conversation list shows the customer, not the shop', async ({
        page,
    }) => {
        await login(page, 'seller@example.com');
        await page.goto('/seller/chat');

        const list = page.getByRole('navigation', { name: 'Conversations' });
        await expect(list).toContainText(fixture.customerName);
        // Every thread used to be labelled with the seller's own store name.
        await expect(list).not.toContainText(fixture.shopName);
        await expect(list).not.toContainText(fixture.customerEmail);
        await shot(page, 'seller-chat-01-list');
    });

    test('search matches customer names', async ({ page }) => {
        await login(page, 'seller@example.com');
        await page.goto('/seller/chat');
        const list = page.getByRole('navigation', { name: 'Conversations' });
        const search = page.locator('#chat-search');

        await search.fill('Chatwell');
        await expect(list).toContainText(fixture.customerName);

        await search.fill('zzz-no-such-customer');
        await expect(list).not.toContainText(fixture.customerName);
        await shot(page, 'seller-chat-02-search-empty');
    });

    test('the thread header names the customer', async ({ page }) => {
        await login(page, 'seller@example.com');
        await page.goto(`/seller/chat/${fixture.conversationId}`);

        // The list row repeats the name, so take the thread header (last in DOM).
        await expect(
            page
                .locator('p.text-label', { hasText: fixture.customerName })
                .last(),
        ).toBeVisible();
        // The seller's own shop has no "Visit shop" shortcut here.
        await expect(
            page.getByRole('link', { name: 'Visit shop' }),
        ).toHaveCount(0);
        await shot(page, 'seller-chat-03-thread');
    });

    test('customer messages sit left and shop messages sit right', async ({
        page,
    }) => {
        await login(page, 'seller@example.com');
        await page.goto(`/seller/chat/${fixture.conversationId}`);

        const customer = page.locator('li', {
            has: page.getByText(fixture.buyerText),
        });
        const shop = page.locator('li', {
            has: page.getByText(fixture.sellerText),
        });

        await expect(customer).toHaveClass(/justify-start/);
        await expect(shop).toHaveClass(/justify-end/);

        const customerBox = await customer
            .getByText(fixture.buyerText)
            .boundingBox();
        const shopBox = await shop.getByText(fixture.sellerText).boundingBox();
        expect(customerBox && shopBox).toBeTruthy();
        expect(customerBox!.x).toBeLessThan(shopBox!.x);
        await shot(page, 'seller-chat-04-alignment');
    });

    test('the buyer still sees their own messages on the right', async ({
        page,
    }) => {
        await login(page, fixture.customerEmail);
        await page.goto(`/account/chat/${fixture.conversationId}`);

        await expect(
            page.locator('li', { has: page.getByText(fixture.buyerText) }),
        ).toHaveClass(/justify-end/);
        await expect(
            page.locator('li', { has: page.getByText(fixture.sellerText) }),
        ).toHaveClass(/justify-start/);
        // The buyer's header still names the shop.
        await expect(
            page.locator('p.text-label', { hasText: fixture.shopName }).last(),
        ).toBeVisible();
        await shot(page, 'seller-chat-05-buyer-view');
    });
});
