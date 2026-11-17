<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use App\Notifications\SellerOrderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Owner of shop A who is also active staff at shop B.
 *
 * @return array{user: User, own: Shop, managed: Shop, otherOwner: User}
 */
function perShopDualSetup(): array
{
    $user = User::factory()->create();
    $own = Shop::factory()->create(['user_id' => $user->id, 'name' => 'Own Shop']);

    $otherOwner = User::factory()->create();
    $managed = Shop::factory()->create(['user_id' => $otherOwner->id, 'name' => 'Managed Shop']);
    ShopStaff::factory()->create([
        'shop_id' => $managed->id,
        'user_id' => $user->id,
        'email' => $user->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $otherOwner->id,
        'accepted_at' => now(),
    ]);

    return compact('user', 'own', 'managed', 'otherOwner');
}

function orderInShop(Shop $shop): Order
{
    return Order::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => User::factory()->create()->id,
        'status' => OrderStatus::ToShip,
    ]);
}

function seedSellerOrderNotification(User $user, Order $order): void
{
    $user->notify(new SellerOrderNotification($order, 'created'));
}

test('seller list and bell count show only the active shop and follow a switch', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = perShopDualSetup();
    seedSellerOrderNotification($user, orderInShop($own));
    seedSellerOrderNotification($user, orderInShop($own));
    seedSellerOrderNotification($user, orderInShop($managed));

    $this->actingAs($user)->getJson(route('seller.notifications.index'))
        ->assertOk()
        ->assertJsonCount(2, 'notifications')
        ->assertJsonPath('notifications.0.data.shop_id', $own->id)
        ->assertJsonPath('notifications.1.data.shop_id', $own->id);

    $this->actingAs($user)->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('unreadCounts.notifications', 2)
            ->where('seller.shops.0.id', $own->id)
            ->where('seller.shops.0.unread_notifications', 2)
            ->where('seller.shops.1.id', $managed->id)
            ->where('seller.shops.1.unread_notifications', 1));

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id]);

    $this->actingAs($user)->getJson(route('seller.notifications.index'))
        ->assertOk()
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.data.shop_id', $managed->id);

    $this->actingAs($user)->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('unreadCounts.notifications', 1)
            ->where('seller.shop_id', $managed->id)
            ->where('seller.shops.0.unread_notifications', 2)
            ->where('seller.shops.1.unread_notifications', 1));
});

test('mark all read in the active shop leaves other shops and buyer notifications unread', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = perShopDualSetup();
    $ownOrder = orderInShop($own);
    $managedOrder = orderInShop($managed);
    seedSellerOrderNotification($user, $ownOrder);
    seedSellerOrderNotification($user, $managedOrder);

    $buyerOrder = Order::factory()->create([
        'shop_id' => $own->id,
        'user_id' => $user->id,
        'status' => OrderStatus::ToShip,
    ]);
    $user->notify(new OrderStatusNotification($buyerOrder, 'Buyer update', 'Your order moved.'));

    expect($user->unreadNotifications()->count())->toBe(3);

    $this->actingAs($user)->postJson(route('notifications.read.store'), [
        'workspace' => 'seller',
    ])->assertOk();

    $user->refresh();
    expect($user->unreadNotifications()->count())->toBe(2);

    $unread = $user->unreadNotifications()->get();
    expect($unread->contains(fn ($n) => ($n->data['shop_id'] ?? null) === $managed->id))->toBeTrue()
        ->and($unread->contains(fn ($n) => ($n->data['workspace'] ?? null) === 'buyer'))->toBeTrue()
        ->and($unread->contains(fn ($n) => ($n->data['shop_id'] ?? null) === $own->id))->toBeFalse();
});

test('marking a notification id from a non-active shop is a no-op', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = perShopDualSetup();
    seedSellerOrderNotification($user, orderInShop($own));
    seedSellerOrderNotification($user, orderInShop($managed));

    $managedNotificationId = $user->unreadNotifications()
        ->get()
        ->first(fn ($n) => ($n->data['shop_id'] ?? null) === $managed->id)
        ->id;

    $this->actingAs($user)->postJson(route('notifications.read.store'), [
        'id' => $managedNotificationId,
        'workspace' => 'seller',
    ])->assertOk();

    expect($user->fresh()->unreadNotifications()->count())->toBe(2);
    expect($user->fresh()->unreadNotifications()->where('id', $managedNotificationId)->exists())->toBeTrue();
});

test('backfill assigns shop_id to legacy seller rows and leaves orphaned rows out of the list', function () {
    ['user' => $user, 'own' => $own] = perShopDualSetup();
    $order = orderInShop($own);

    $legacyId = (string) Str::uuid();
    $orphanId = (string) Str::uuid();

    DB::table('notifications')->insert([
        [
            'id' => $legacyId,
            'type' => SellerOrderNotification::class,
            'notifiable_type' => $user->getMorphClass(),
            'notifiable_id' => $user->id,
            'data' => json_encode([
                'type' => 'order',
                'workspace' => 'seller',
                'order_id' => $order->id,
                'title' => 'Legacy order',
                'text' => 'Missing shop_id',
                'url' => '/seller/orders/'.$order->id,
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => $orphanId,
            'type' => SellerOrderNotification::class,
            'notifiable_type' => $user->getMorphClass(),
            'notifiable_id' => $user->id,
            'data' => json_encode([
                'type' => 'order',
                'workspace' => 'seller',
                'order_id' => 'order_that_no_longer_exists',
                'title' => 'Orphan',
                'text' => 'Order gone',
                'url' => '/seller/orders/missing',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $migration = require database_path('migrations/2026_11_17_000100_backfill_shop_id_on_seller_notifications.php');
    $migration->up();

    $legacy = DB::table('notifications')->where('id', $legacyId)->value('data');
    $orphan = DB::table('notifications')->where('id', $orphanId)->value('data');

    expect(json_decode($legacy, true)['shop_id'] ?? null)->toBe($own->id)
        ->and(json_decode($orphan, true)['shop_id'] ?? null)->toBeNull();

    $this->actingAs($user)->getJson(route('seller.notifications.index'))
        ->assertOk()
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.id', $legacyId);
});

test('removed from a shop drops its notifications from lists and counts', function () {
    ['user' => $user, 'own' => $own, 'managed' => $managed] = perShopDualSetup();
    seedSellerOrderNotification($user, orderInShop($own));
    seedSellerOrderNotification($user, orderInShop($managed));

    $membership = ShopStaff::query()
        ->where('shop_id', $managed->id)
        ->where('user_id', $user->id)
        ->firstOrFail();

    $this->actingAs($user)->delete("/seller/staff/{$membership->id}")->assertRedirect();

    $this->actingAs($user)->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('seller.shops', 1)
            ->where('seller.shops.0.id', $own->id)
            ->where('seller.shops.0.unread_notifications', 1)
            ->where('unreadCounts.notifications', 1));

    $this->actingAs($user)->getJson(route('seller.notifications.index'))
        ->assertOk()
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.data.shop_id', $own->id);

    $this->actingAs($user)->put('/seller/active-shop', ['shop_id' => $managed->id])->assertNotFound();
});
