<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Notifications\SellerOrderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('user can list their orders', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $shop = Shop::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $order1 = Order::factory()->toShip()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
    OrderItem::factory()->create(['order_id' => $order1->id, 'product_id' => $product->id]);

    $order2 = Order::factory()->completed()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
    OrderItem::factory()->create(['order_id' => $order2->id, 'product_id' => $product->id]);

    // Other user order should not appear
    Order::factory()->create(['user_id' => $otherUser->id, 'shop_id' => $shop->id]);

    $response = $this->actingAs($user)->get(route('orders.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('account/orders')
        ->has('orders.data', 2)
    );
});

test('user can view their order details with tracking timeline', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create();
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $order = Order::factory()->toReceive()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
    OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);

    OrderEvent::factory()->create([
        'order_id' => $order->id,
        'title' => 'Parcel is out for delivery',
        'detail' => 'Rider is on the way',
    ]);

    $response = $this->actingAs($user)->get(route('orders.show', $order));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('account/order')
        ->where('order.id', $order->id)
        ->has('order.events', 1)
        ->where('order.events.0.title', 'Parcel is out for delivery')
    );
});

test('user cannot view another user order detail', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $order = Order::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->get(route('orders.show', $order))
        ->assertNotFound();
});

test('user can cancel a cancellable order', function () {
    $user = User::factory()->create();
    $order = Order::factory()->toShip()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post(route('orders.cancel', $order))
        ->assertRedirect(route('orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled);
    $this->assertDatabaseHas('order_events', [
        'order_id' => $order->id,
        'title' => 'Order cancelled',
    ]);
});

test('user cannot cancel an order in to_receive or completed status', function () {
    $user = User::factory()->create();
    $order = Order::factory()->toReceive()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post(route('orders.cancel', $order))
        ->assertSessionHasErrors('order');

    expect($order->fresh()->status)->toBe(OrderStatus::ToReceive);
});

test('user can mark an order in to_receive as received', function () {
    Notification::fake();

    $user = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $order = Order::factory()->toReceive()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

    $this->actingAs($user)
        ->put(route('orders.received', $order))
        ->assertRedirect(route('orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Completed);
    $this->assertDatabaseHas('order_events', [
        'order_id' => $order->id,
        'title' => 'Order received',
    ]);

    Notification::assertSentTo($seller, SellerOrderNotification::class, fn (SellerOrderNotification $notification): bool => $notification->event === 'received');
});

test('user can request return/refund for a completed order', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $order->shop_id]);
    $item = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id, 'qty' => 2]);

    $this->actingAs($user)
        ->post(route('orders.return', $order), [
            'reason' => 'Package arrived with damaged items.',
            'items' => [['order_item_id' => $item->id, 'qty' => 1]],
        ])
        ->assertRedirect(route('orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::ReturnRefund);
    $this->assertDatabaseHas('order_events', [
        'order_id' => $order->id,
        'title' => 'Return/refund requested',
        'detail' => 'Package arrived with damaged items.',
    ]);
    expect($order->events()->latest()->first()->metadata['items'])->toBe([
        ['order_item_id' => $item->id, 'qty' => 1],
    ]);
});

test('tracking url resolves from courier templates or explicit url', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create();
    $order = Order::factory()->toReceive()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

    $order->fulfillments()->create([
        'courier_name' => 'J&T Express',
        'tracking_number' => 'JT12345678',
        'status' => 'shipped',
        'shipped_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('orders.show', $order));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('account/order')
        ->where('order.fulfillments.0.tracking_url', 'https://www.jtexpress.ph/trajectoryQuery?bills=JT12345678')
    );
});
