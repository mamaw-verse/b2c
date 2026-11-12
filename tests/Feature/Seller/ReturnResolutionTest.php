<?php

declare(strict_types=1);

use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

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
});

test('seller approves a return and order becomes refunded with ledger entry', function () {
    Notification::fake();

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve'])
        ->assertRedirect();

    $this->order->refresh();
    expect($this->order->status)->toBe(OrderStatus::Refunded);

    expect($this->order->ledgerEntries()->where('type', LedgerEntryType::Refund)->exists())->toBeTrue();

    Notification::assertSentTo($this->buyer, App\Notifications\OrderStatusNotification::class);
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

    Notification::assertSentTo($this->buyer, App\Notifications\OrderStatusNotification::class);
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
        ->post(route('seller.orders.return.store', $this->order), ['decision' => 'approve'])
        ->assertNotFound();
});

test('a non-return order cannot be resolved', function () {
    $order = Order::factory()->completed()->create(['shop_id' => $this->shop->id]);

    $this->actingAs($this->seller)
        ->post(route('seller.orders.return.store', $order), ['decision' => 'approve'])
        ->assertNotFound();
});
