<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest cannot access notifications', function () {
    $this->get(route('notifications.index'))->assertRedirect(route('login'));
});

test('user can list their notifications and mark them as read', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create();
    $order = Order::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    $user->notify(new OrderStatusNotification($order, 'Parcel out for delivery', 'Order #123 will arrive today.'));

    expect($user->unreadNotifications()->count())->toBe(1);

    $response = $this->actingAs($user)->getJson(route('notifications.index'));
    $response->assertOk()
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.data.title', 'Parcel out for delivery');

    // Mark as read
    $notificationId = $user->unreadNotifications()->first()->id;
    $this->actingAs($user)->postJson(route('notifications.read.store'), [
        'id' => $notificationId,
    ])->assertOk();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

test('user can mark all notifications as read', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create();
    $order = Order::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    $user->notify(new OrderStatusNotification($order, 'Update 1', 'Text 1'));
    $user->notify(new OrderStatusNotification($order, 'Update 2', 'Text 2'));

    expect($user->unreadNotifications()->count())->toBe(2);

    $this->actingAs($user)->postJson(route('notifications.read.store'))->assertOk();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});
