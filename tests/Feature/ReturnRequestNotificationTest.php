<?php

declare(strict_types=1);

use App\Actions\Order\RequestReturn;
use App\Enums\OrderStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Notifications\RefundDecisionNotification;
use App\Notifications\SellerReturnRequestedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->owner->id]);
    $this->buyer = User::factory()->create();

    $product = Product::factory()->create(['shop_id' => $this->shop->id]);

    $this->order = Order::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
        'status' => OrderStatus::Completed,
        'subtotal' => 100_00,
        'voucher_discount' => 0,
    ]);

    OrderItem::factory()->create([
        'order_id' => $this->order->id,
        'product_id' => $product->id,
        'unit_price' => 100_00,
        'qty' => 1,
        'subtotal' => 100_00,
    ]);

    // Make the order status returnable
    $this->order->update(['status' => OrderStatus::Completed]);
});

test('return request sends SellerReturnRequestedNotification to owner and active staff but not inactive staff', function () {
    Notification::fake();

    $activeStaff = User::factory()->create();
    $inactiveStaff = User::factory()->create();

    ShopStaff::factory()->active()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $activeStaff->id,
    ]);

    ShopStaff::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $inactiveStaff->id,
        'status' => ShopStaffStatus::Pending,
        'email' => $inactiveStaff->email,
    ]);

    // Make order returnable
    $this->order->update(['status' => OrderStatus::Completed]);

    app(RequestReturn::class)->handle(
        $this->buyer,
        $this->order,
        'Item arrived damaged.',
    );

    Notification::assertSentTo($this->owner, SellerReturnRequestedNotification::class);
    Notification::assertSentTo($activeStaff, SellerReturnRequestedNotification::class);
    Notification::assertNotSentTo($inactiveStaff, SellerReturnRequestedNotification::class);
});

test('SellerReturnRequestedNotification payload has correct shop_id and workspace', function () {
    Notification::fake();

    $this->order->update(['status' => OrderStatus::Completed]);

    app(RequestReturn::class)->handle(
        $this->buyer,
        $this->order,
        'Wrong item sent.',
    );

    Notification::assertSentTo(
        $this->owner,
        SellerReturnRequestedNotification::class,
        function (SellerReturnRequestedNotification $notification) {
            $payload = $notification->toArray($this->owner);

            return $payload['shop_id'] === $this->order->shop_id
                && $payload['workspace'] === 'seller'
                && $payload['order_id'] === $this->order->id;
        }
    );
});

test('SellerReturnRequestedNotification is sent on both database and mail channels', function () {
    Notification::fake();

    $this->order->update(['status' => OrderStatus::Completed]);

    app(RequestReturn::class)->handle(
        $this->buyer,
        $this->order,
        'Defective product.',
    );

    Notification::assertSentTo(
        $this->owner,
        SellerReturnRequestedNotification::class,
        function (SellerReturnRequestedNotification $n) {
            return $n->via($this->owner) === ['database', 'mail'];
        }
    );
});

test('RefundDecisionNotification approved is sent on both database and mail channels', function () {
    Notification::fake();

    $order = Order::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
        'status' => OrderStatus::ReturnRefund,
        'subtotal' => 100_00,
        'voucher_discount' => 0,
    ]);

    $product = Product::factory()->create(['shop_id' => $this->shop->id]);
    $item = OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'unit_price' => 100_00,
        'qty' => 1,
        'subtotal' => 100_00,
    ]);

    $this->actingAs($this->owner)
        ->post(route('seller.orders.return.store', $order), [
            'decision' => 'approve',
            'items' => [['order_item_id' => $item->id, 'qty' => 1]],
        ])
        ->assertRedirect();

    Notification::assertSentTo(
        $this->buyer,
        RefundDecisionNotification::class,
        function (RefundDecisionNotification $n) {
            return $n->outcome === 'approved'
                && $n->amount > 0
                && $n->via($this->buyer) === ['database', 'mail'];
        }
    );
});

test('RefundDecisionNotification declined is sent on both database and mail channels', function () {
    Notification::fake();

    $order = Order::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
        'status' => OrderStatus::ReturnRefund,
    ]);

    $this->actingAs($this->owner)
        ->post(route('seller.orders.return.store', $order), [
            'decision' => 'reject',
            'note' => 'The item is not damaged.',
        ])
        ->assertRedirect();

    Notification::assertSentTo(
        $this->buyer,
        RefundDecisionNotification::class,
        function (RefundDecisionNotification $n) {
            return $n->outcome === 'declined'
                && $n->note === 'The item is not damaged.'
                && $n->via($this->buyer) === ['database', 'mail'];
        }
    );
});

test('RefundDecisionNotification database payload has buyer workspace', function () {
    $n = new RefundDecisionNotification($this->order, 'approved', 100_00);
    $payload = $n->toArray($this->buyer);

    expect($payload['workspace'])->toBe('buyer')
        ->and($payload['type'])->toBe('order')
        ->and($payload['order_id'])->toBe($this->order->id);
});
