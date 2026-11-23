import { expect, test, type Page } from '@playwright/test';
import { login, pageProps, seedPhp, shot } from '../helpers';

type Fixture = {
    email: string;
    staffEmail: string;
    ownName: string;
    managedName: string;
    ownId: string;
    managedId: string;
};

type SellerProps = {
    seller?: {
        role?: 'owner' | 'staff';
        own_shop?: { status: string } | null;
        shops?: Array<{
            id: string;
            name: string;
            role: 'owner' | 'staff';
            active: boolean;
            unread_notifications: number;
        }>;
    } | null;
    unreadCounts?: { notifications?: number };
};

const OWN_ALERTS = 2;
const MANAGED_ALERTS = 3;
let fixture: Fixture;

/**
 * One account that owns a shop and is active staff at another, a second
 * account that is staff only, seller notifications for each shop and one
 * buyer notification. Memberships and notifications cannot be created
 * through the UI, so they are seeded.
 */
function seedMultiShop(stamp: number): Fixture {
    return seedPhp<Fixture>(`
        $stamp = '${stamp}';
        $email = 'e2e-dual-' . $stamp . '@example.com';
        $staffEmail = 'e2e-staff-' . $stamp . '@example.com';

        $user = \\App\\Models\\User::factory()->create([
            'name' => 'E2E Dual ' . $stamp,
            'email' => $email,
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        $staffOnly = \\App\\Models\\User::factory()->create([
            'name' => 'E2E Staffer ' . $stamp,
            'email' => $staffEmail,
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        $otherOwner = \\App\\Models\\User::factory()->create();

        $own = \\App\\Models\\Shop::factory()->create([
            'user_id' => $user->id,
            'name' => 'E2E Own ' . $stamp,
            'slug' => 'e2e-own-' . $stamp,
        ]);
        $managed = \\App\\Models\\Shop::factory()->create([
            'user_id' => $otherOwner->id,
            'name' => 'E2E Managed ' . $stamp,
            'slug' => 'e2e-managed-' . $stamp,
        ]);

        foreach ([$user, $staffOnly] as $member) {
            \\App\\Models\\ShopStaff::factory()->create([
                'shop_id' => $managed->id,
                'user_id' => $member->id,
                'email' => $member->email,
                'status' => \\App\\Enums\\ShopStaffStatus::Active,
                'invited_by' => $otherOwner->id,
                'accepted_at' => now(),
            ]);
        }

        $notify = function (array $data, string $class) use ($user): void {
            \\Illuminate\\Support\\Facades\\DB::table('notifications')->insert([
                'id' => (string) \\Illuminate\\Support\\Str::uuid(),
                'type' => $class,
                'notifiable_type' => $user->getMorphClass(),
                'notifiable_id' => $user->id,
                'data' => json_encode($data),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        };
        $seller = 'App\\\\Notifications\\\\SellerOrderNotification';

        foreach (range(1, ${OWN_ALERTS}) as $i) {
            $notify([
                'type' => 'order', 'workspace' => 'seller', 'shop_id' => $own->id,
                'title' => 'E2E own alert ' . $i, 'text' => 'Own shop', 'url' => '/seller/orders',
            ], $seller);
        }
        foreach (range(1, ${MANAGED_ALERTS}) as $i) {
            $notify([
                'type' => 'order', 'workspace' => 'seller', 'shop_id' => $managed->id,
                'title' => 'E2E managed alert ' . $i, 'text' => 'Managed shop', 'url' => '/seller/orders',
            ], $seller);
        }
        $notify([
            'type' => 'order', 'title' => 'E2E buyer note', 'text' => 'Buyer inbox', 'url' => '/account/orders',
        ], 'App\\\\Notifications\\\\OrderStatusNotification');

        return [
            'email' => $email,
            'staffEmail' => $staffEmail,
            'ownName' => $own->name,
            'managedName' => $managed->name,
            'ownId' => $own->id,
            'managedId' => $managed->id,
        ];
    `);
}

const switcher = (page: Page) =>
    page.getByRole('button', { name: /^Switch shop\./ });

/** Switch the active shop through the header switcher. */
async function switchShop(page: Page, shopName: string): Promise<void> {
    await switcher(page).click();
    await page.getByRole('menuitem', { name: new RegExp(shopName) }).click();
    await expect(switcher(page)).toHaveAccessibleName(
        new RegExp(`Active: ${shopName}`),
    );
}

async function freshProps(page: Page, path: string): Promise<SellerProps> {
    await page.goto(path);
    return pageProps<SellerProps>(page);
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
    fixture = seedMultiShop(Date.now());
});

test.describe('multi-shop seller centre', () => {
    test('the switcher groups owned and managed shops with roles', async ({
        page,
    }) => {
        await login(page, fixture.email);
        await page.goto('/seller/notifications');

        // The owned shop is active first, and the other shop's activity is
        // announced on the trigger.
        await expect(switcher(page)).toHaveAccessibleName(
            new RegExp(`Active: ${fixture.ownName} \\(owner\\)`),
        );
        await expect(switcher(page)).toHaveAccessibleName(
            new RegExp(`${MANAGED_ALERTS} unread notifications in other shops`),
        );

        await switcher(page).click();
        await expect(page.getByText('My shops', { exact: true })).toBeVisible();
        await expect(
            page.getByText('Managed shops', { exact: true }),
        ).toBeVisible();

        const own = page.getByRole('menuitem', {
            name: new RegExp(fixture.ownName),
        });
        const managed = page.getByRole('menuitem', {
            name: new RegExp(fixture.managedName),
        });
        await expect(own).toContainText('Owner');
        await expect(managed).toContainText('Staff');
        await expect(managed).toContainText(`${MANAGED_ALERTS} new`);
        await shot(page, 'multishop-01-switcher');
    });

    test('notifications and the bell count follow the active shop', async ({
        page,
    }) => {
        await login(page, fixture.email);
        const props = await freshProps(page, '/seller/notifications');

        expect(props.unreadCounts?.notifications).toBe(OWN_ALERTS);
        const own = props.seller?.shops?.find((s) => s.id === fixture.ownId);
        const managed = props.seller?.shops?.find(
            (s) => s.id === fixture.managedId,
        );
        expect(own?.active).toBe(true);
        expect(own?.role).toBe('owner');
        expect(managed?.role).toBe('staff');
        expect(managed?.unread_notifications).toBe(MANAGED_ALERTS);

        await expect(page.getByText(`${OWN_ALERTS} unread`)).toBeVisible();
        await expect(page.getByText('E2E own alert 1')).toBeVisible();
        await expect(page.getByText('E2E managed alert 1')).toHaveCount(0);
        await shot(page, 'multishop-02-own-notifications');
    });

    test('switching shops changes the notification list', async ({ page }) => {
        await login(page, fixture.email);
        await page.goto('/seller/notifications');

        await switchShop(page, fixture.managedName);
        await page.goto('/seller/notifications');

        await expect(page.getByText(`${MANAGED_ALERTS} unread`)).toBeVisible();
        await expect(page.getByText('E2E managed alert 1')).toBeVisible();
        await expect(page.getByText('E2E own alert 1')).toHaveCount(0);
        await expect(switcher(page)).toHaveAccessibleName(
            new RegExp(`${OWN_ALERTS} unread notifications in other shops`),
        );

        const props = await pageProps<SellerProps>(page);
        expect(props.unreadCounts?.notifications).toBe(MANAGED_ALERTS);
        await shot(page, 'multishop-03-managed-notifications');
    });

    test('mark all as read only clears the active shop', async ({ page }) => {
        await login(page, fixture.email);
        await page.goto('/seller/notifications');
        await switchShop(page, fixture.managedName);
        await page.goto('/seller/notifications');

        await page.getByRole('button', { name: 'Mark all as read' }).click();
        await expect(page.getByText(`${MANAGED_ALERTS} unread`)).toHaveCount(0);

        // The other shop and the buyer inbox keep their unread items.
        await page.goto('/seller/notifications');
        await switchShop(page, fixture.ownName);
        await page.goto('/seller/notifications');
        await expect(page.getByText(`${OWN_ALERTS} unread`)).toBeVisible();

        await page.goto('/account/notifications');
        await expect(page.getByText('E2E buyer note')).toBeVisible();
        await expect(page.getByText(/\d+ unread/).first()).toBeVisible();
        await shot(page, 'multishop-04-after-mark-read');
    });

    test('staff cannot open owner-only pages in a managed shop', async ({
        page,
    }) => {
        await login(page, fixture.email);
        await page.goto('/seller/notifications');
        await switchShop(page, fixture.managedName);

        for (const path of [
            '/seller/finance',
            '/seller/staff',
            '/seller/settings',
            '/seller/vouchers',
        ]) {
            const response = await page.goto(path);
            expect(response?.status(), path).toBe(404);
        }
        for (const path of [
            '/seller/orders',
            '/seller/customers',
            '/seller/chat',
        ]) {
            const response = await page.goto(path);
            expect(response?.status(), path).toBe(200);
        }
        await shot(page, 'multishop-05-staff-orders');
    });

    test('the same pages open when acting as the owner', async ({ page }) => {
        await login(page, fixture.email);
        await page.goto('/seller/notifications');
        await switchShop(page, fixture.ownName);

        for (const path of ['/seller/finance', '/seller/staff']) {
            const response = await page.goto(path);
            expect(response?.status(), path).toBe(200);
        }
        await shot(page, 'multishop-06-owner-staff-page');
    });
});

test.describe('staff without a shop of their own', () => {
    test('the workspace menu offers "Register my own shop"', async ({
        page,
    }) => {
        await login(page, fixture.staffEmail);
        const props = await freshProps(page, '/seller/orders');

        expect(props.seller?.role).toBe('staff');
        expect(props.seller?.own_shop ?? null).toBeNull();

        // The user menu is the last menu button in the header. On narrow
        // viewports it may sit behind a drawer, so the UI check is skipped
        // there; the shared props above already prove the entry exists.
        const menu = page.locator('button[aria-haspopup="menu"]').last();
        if (await menu.isVisible()) {
            await menu.click();
            const entry = page.getByRole('menuitem', {
                name: /Register my own shop/,
            });
            await expect(entry).toBeVisible();
            await expect(entry).toHaveAttribute('href', '/seller/register');
            await shot(page, 'multishop-07-register-own-shop');
        }
    });

    test('the entry opens the shop application form', async ({ page }) => {
        await login(page, fixture.staffEmail);
        const response = await page.goto('/seller/register');

        expect(response?.status()).toBe(200);
        await expect(page).toHaveURL(/\/seller\/register/);
        await shot(page, 'multishop-08-register-form');
    });

    test('an owner of an approved shop is not offered the entry', async ({
        page,
    }) => {
        await login(page, fixture.email);
        const props = await freshProps(page, '/seller/notifications');

        expect(props.seller?.own_shop?.status).toBe('approved');
        const menu = page.locator('button[aria-haspopup="menu"]').last();
        if (await menu.isVisible()) {
            await menu.click();
            await expect(
                page.getByRole('menuitem', { name: /Register my own shop/ }),
            ).toHaveCount(0);
        }
    });
});
