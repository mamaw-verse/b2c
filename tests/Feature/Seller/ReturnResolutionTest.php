<?php

declare(strict_types=1);

use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Notifications\RefundDecisionNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->buyer = User::factory()->create();
    $this->order = Order::factory()->returnRefund()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->buyer->id,
        'subtotal' => 100_00,
        'voucher_discount' => 0,
    ]);
    $product = Product::factory()->create(['shop_id' => $this->shop->id]);
    $this->orderItem = OrderItem::factory()->create([
        'order_id' => $this->order->id,
        'product_id' => $product->id,
        'unit_price' => 100_00,
        'qty' => 1,
        'subtotal' => 100_00,
    ]);
});

test('seller approves a return and order becomes refunded with ledger entry', function () {
    Notification::fake();

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve', 'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]]])
        ->assertRedirect();

    $this->order->refresh();
    expect($this->order->status)->toBe(OrderStatus::Refunded);

    expect($this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->exists())->toBeTrue();

    Notification::assertSentTo($this->buyer, RefundDecisionNotification::class, function (RefundDecisionNotification $n) {
        return $n->outcome === 'approved';
    });
});

test('seller rejects a return and order returns to completed with no ledger entry', function () {
    Notification::fake();

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), [
            'decision' => 'reject',
            'note' => 'Item is not eligible for return.',
        ])
        ->assertRedirect();

    $this->order->refresh();
    expect($this->order->status)->toBe(OrderStatus::Completed);

    expect($this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->exists())->toBeFalse();

    Notification::assertSentTo($this->buyer, RefundDecisionNotification::class, function (RefundDecisionNotification $n) {
        return $n->outcome === 'declined';
    });
});

test('reject requires a note', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'reject'])
        ->assertSessionHasErrors('note');
});

test('a different seller cannot resolve the return', function () {
    $other = User::factory()->create();
    Shop::factory()->create(['user_id' => $other->id]);

    $this->actingAs($other)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve', 'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]]])
        ->assertNotFound();
});

test('seller can approve a partial refund and later refund the remaining quantity', function () {
    $this->orderItem->update(['qty' => 2, 'unit_price' => 50_00, 'subtotal' => 100_00]);
    $this->order->update(['voucher_discount' => 1_000]);

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve', 'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]]])
        ->assertRedirect();

    expect($this->order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($this->orderItem->refundedUnits())->toBe(1)
        ->and((int) $this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->sum('amount'))->toBe(-4_500)
        ->and($this->order->events()->where('title', 'Partial refund approved')->exists())->toBeTrue();

    $this->actingAs($this->buyer)
        ->post(route('orders.return', $this->order), [
            'reason' => 'The remaining unit is also damaged.',
            'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]],
            'photos' => [UploadedFile::fake()->image('proof1.jpg'), UploadedFile::fake()->image('proof2.jpg')],
        ])
        ->assertRedirect();

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve', 'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]]])
        ->assertRedirect();

    expect($this->order->fresh()->status)->toBe(OrderStatus::Refunded)
        ->and((int) $this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->sum('amount'))->toBe(-9_000)
        ->and($this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->count())->toBe(2);
});

test('seller cannot approve a quantity greater than the unrefunded amount', function () {
    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), [
            'decision' => 'approve',
            'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 2]],
        ])
        ->assertSessionHasErrors('items.0.qty');
});

test('a non-return order cannot be resolved', function () {
    $order = Order::factory()->completed()->create(['shop_id' => $this->shop->id]);

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $order), ['decision' => 'approve'])
        ->assertNotFound();
});

test('seller order view exposes customer proofs and refund details', function () {
    Storage::fake('public');

    $photo1 = UploadedFile::fake()->image('proof1.jpg')->store('return-proofs/photos', 'public');
    $photo2 = UploadedFile::fake()->image('proof2.jpg')->store('return-proofs/photos', 'public');
    $video = UploadedFile::fake()->create('proof.mp4', 1000, 'video/mp4')->store('return-proofs/videos', 'public');

    $this->order->events()->create([
        'title' => 'Return/refund requested',
        'detail' => 'Damaged items',
        'metadata' => [
            'items' => [['order_item_id' => $this->orderItem->id, 'qty' => 1]],
            'photos' => [$photo1, $photo2],
            'video' => $video,
        ],
    ]);

    $this->actingAs($this->seller)
        ->get(route('seller.orders.show', $this->order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/orders/show')
            ->has('order.return_request.photos', 2)
            ->where('order.return_request.video', Storage::disk('public')->url($video))
        );
});
