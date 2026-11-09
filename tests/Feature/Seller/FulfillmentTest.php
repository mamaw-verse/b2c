<?php

declare(strict_types=1);

use App\Enums\FulfillmentStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->order = Order::factory()->toShip()->create(['shop_id' => $this->shop->id]);
    $this->itemA = OrderItem::factory()->create(['order_id' => $this->order->id, 'qty' => 3]);
    $this->itemB = OrderItem::factory()->create(['order_id' => $this->order->id, 'qty' => 1]);
});

test('shipping all items fulfills the order', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.orders.fulfillments.store', $this->order), ['courier_name' => 'J&T', 'tracking_number' => 'T1'])
        ->assertRedirect();

    $order = $this->order->fresh();
    expect($order->status)->toBe(OrderStatus::ToReceive)
        ->and($order->fulfillment_status)->toBe(FulfillmentStatus::Fulfilled)
        ->and($order->fulfillments)->toHaveCount(1)
        ->and($order->fulfillments->first()->items)->toHaveCount(2);
});

test('partial then final shipment moves the order to to_receive', function () {
    $this->actingAs($this->seller)->post(route('seller.orders.fulfillments.store', $this->order), [
        'courier_name' => 'J&T', 'tracking_number' => 'T1',
        'items' => [['order_item_id' => $this->itemA->id, 'quantity' => 2]],
    ])->assertRedirect();

    $order = $this->order->fresh();
    expect($order->status)->toBe(OrderStatus::ToShip)
        ->and($order->fulfillment_status)->toBe(FulfillmentStatus::Partial);

    $this->actingAs($this->seller)->post(route('seller.orders.fulfillments.store', $order), [
        'courier_name' => 'LBC', 'tracking_number' => 'T2',
    ])->assertRedirect();

    $order = $this->order->fresh();
    expect($order->status)->toBe(OrderStatus::ToReceive)
        ->and($order->fulfillment_status)->toBe(FulfillmentStatus::Fulfilled)
        ->and($order->fulfillments)->toHaveCount(2);
});

test('over-quantity is rejected', function () {
    $this->actingAs($this->seller)->post(route('seller.orders.fulfillments.store', $this->order), [
        'courier_name' => 'J&T', 'tracking_number' => 'T1',
        'items' => [['order_item_id' => $this->itemA->id, 'quantity' => 4]],
    ])->assertSessionHasErrors('items.0.quantity');

    expect($this->order->fresh()->fulfillments)->toHaveCount(0);
});

test('another shop cannot fulfill the order', function () {
    $other = User::factory()->create();
    Shop::factory()->create(['user_id' => $other->id]);

    $this->actingAs($other)->post(route('seller.orders.fulfillments.store', $this->order), ['courier_name' => 'J&T', 'tracking_number' => 'T1'])
        ->assertNotFound();
});

test('tracking can be edited while shipped', function () {
    $this->actingAs($this->seller)->post(route('seller.orders.fulfillments.store', $this->order), ['courier_name' => 'J&T', 'tracking_number' => 'T1']);
    $fulfillment = $this->order->fresh()->fulfillments->first();

    $this->actingAs($this->seller)->put(route('seller.orders.fulfillments.update', [$this->order, $fulfillment]), ['courier_name' => 'LBC', 'tracking_number' => 'T9'])
        ->assertRedirect();

    expect($fulfillment->fresh()->tracking_number)->toBe('T9');
});

test('buyer cannot cancel after a partial shipment', function () {
    $this->actingAs($this->seller)->post(route('seller.orders.fulfillments.store', $this->order), [
        'courier_name' => 'J&T', 'tracking_number' => 'T1',
        'items' => [['order_item_id' => $this->itemB->id, 'quantity' => 1]],
    ]);

    $this->actingAs($this->order->user)->post(route('orders.cancel', $this->order))->assertSessionHasErrors('order');

    expect($this->order->fresh()->status)->toBe(OrderStatus::ToShip);
});

test('seller starts or reuses a chat from an order and sees only own customers', function () {
    $this->actingAs($this->seller)->post(route('seller.orders.chat.store', $this->order))
        ->assertRedirect();
    $this->actingAs($this->seller)->post(route('seller.orders.chat.store', $this->order));

    expect(App\Models\Conversation::where('shop_id', $this->shop->id)->count())->toBe(1);

    $other = User::factory()->create();
    Shop::factory()->create(['user_id' => $other->id]);
    $this->actingAs($other)->post(route('seller.orders.chat.store', $this->order))->assertNotFound();
});

test('customers list contains only the shops buyers', function () {
    Order::factory()->create(['shop_id' => Shop::factory()->create()->id]);

    $this->actingAs($this->seller)->get(route('seller.customers.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('seller/customers')->has('customers', 1)->missing('customers.0.email'));
});
