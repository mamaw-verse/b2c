<?php

declare(strict_types=1);

use App\Actions\Finance\ResolveCommissionRate;
use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Enums\PayoutStatus;
use App\Models\Category;
use App\Models\Fulfillment;
use App\Models\LedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function shippedOrder(Shop $shop, array $order = [], array $item = []): Order
{
    $order = Order::factory()->toReceive()->create($order + ['shop_id' => $shop->id, 'subtotal' => 100000, 'voucher_discount' => 5000, 'platform_voucher_discount' => 3000]);
    OrderItem::factory()->create($item + ['order_id' => $order->id, 'unit_price' => 100000, 'qty' => 1, 'subtotal' => 100000, 'commission_bps' => 500, 'commission_amount' => 5000]);
    Fulfillment::create(['order_id' => $order->id, 'courier_name' => 'J&T', 'tracking_number' => 'T', 'status' => 'shipped', 'shipped_at' => now()->subDays(10)]);

    return $order;
}

test('commission resolves leaf, inherited and default rates', function () {
    config(['marketplace.commission.default_bps' => 300]);
    $parent = Category::factory()->create(['commission_bps' => 800]);
    $child = Category::factory()->create(['parent_id' => $parent->id]);
    $leaf = Category::factory()->create(['parent_id' => $parent->id, 'commission_bps' => 100]);
    $orphan = Category::factory()->create();
    $action = app(ResolveCommissionRate::class);

    expect($action->handle($leaf))->toBe(100)
        ->and($action->handle($child))->toBe(800)
        ->and($action->handle($orphan))->toBe(300);
});

test('completing an order credits the ledger once', function () {
    $buyer = User::factory()->create();
    $shop = Shop::factory()->create();
    $order = shippedOrder($shop, ['user_id' => $buyer->id]);

    $this->actingAs($buyer)->put(route('orders.received', $order))->assertRedirect();
    $this->actingAs($buyer)->put(route('orders.received', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and(LedgerEntry::where('order_id', $order->id)->count())->toBe(3)
        ->and((int) LedgerEntry::where('order_id', $order->id)->sum('amount'))->toBe(95000 - 5000 + 3000)
        ->and(LedgerEntry::where('type', LedgerEntryType::Commission)->value('amount'))->toBe(-5000);
});

test('auto-complete only completes orders past the threshold', function () {
    $shop = Shop::factory()->create();
    $old = shippedOrder($shop);
    $recent = shippedOrder($shop);
    $recent->fulfillments()->update(['shipped_at' => now()->subDays(2)]);

    $this->artisan('orders:auto-complete')->assertSuccessful();
    $this->artisan('orders:auto-complete')->assertSuccessful();

    expect($old->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($recent->fresh()->status)->toBe(OrderStatus::ToReceive)
        ->and(LedgerEntry::where('order_id', $old->id)->count())->toBe(3)
        ->and($old->events()->where('title', 'Order auto-confirmed')->count())->toBe(1);
});

test('payouts respect balance, minimum and account details', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $shop->ledgerEntries()->create(['type' => LedgerEntryType::Adjustment, 'amount' => 200000, 'available_at' => now()->subDay()]);
    $shop->ledgerEntries()->create(['type' => LedgerEntryType::Adjustment, 'amount' => 900000, 'available_at' => now()->addDays(3)]);

    $this->actingAs($seller)->post(route('seller.payouts.store'), ['amount' => 100000])->assertSessionHasErrors('payout_account');

    $this->actingAs($seller)->put(route('seller.payout-account.update'), ['payout_method' => 'GCash', 'payout_account_name' => 'Aisha', 'payout_account_number' => '09171234567'])->assertRedirect();

    $this->actingAs($seller)->post(route('seller.payouts.store'), ['amount' => 1000])->assertSessionHasErrors('amount');
    $this->actingAs($seller)->post(route('seller.payouts.store'), ['amount' => 300000])->assertSessionHasErrors('amount');
    $this->actingAs($seller)->post(route('seller.payouts.store'), ['amount' => 150000])->assertRedirect(route('seller.finance.index'));

    $this->actingAs($seller)->get(route('seller.finance.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('seller/finance')->where('balance.available', 50000)->where('balance.pending', 900000));

    $this->actingAs($seller)->post(route('seller.payouts.store'), ['amount' => 100000])->assertSessionHasErrors('amount');
});

test('admin rejects a payout and funds are released', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->create(['payout_method' => 'GCash', 'payout_account_name' => 'A', 'payout_account_number' => '0917']);
    $shop->ledgerEntries()->create(['type' => LedgerEntryType::Adjustment, 'amount' => 200000, 'available_at' => now()->subDay()]);
    $payout = app(App\Actions\Finance\RequestPayout::class)->handle($shop, 100000);

    $this->actingAs($admin)->put(route('admin.payouts.update', $payout), ['status' => 'rejected'])->assertRedirect();

    expect($payout->fresh()->status)->toBe(PayoutStatus::Rejected)
        ->and(app(App\Actions\Finance\GetShopBalance::class)->handle($shop)['available'])->toBe(200000);
});

test('admin marks a payout paid with a reference; non-admins get 404', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->create(['payout_method' => 'GCash', 'payout_account_name' => 'A', 'payout_account_number' => '0917']);
    $shop->ledgerEntries()->create(['type' => LedgerEntryType::Adjustment, 'amount' => 200000, 'available_at' => now()->subDay()]);
    $payout = app(App\Actions\Finance\RequestPayout::class)->handle($shop, 100000);

    $this->actingAs(User::factory()->create())->get(route('admin.payouts.index'))->assertNotFound();
    $this->actingAs($admin)->put(route('admin.payouts.update', $payout), ['status' => 'paid'])->assertSessionHasErrors('reference');
    $this->actingAs($admin)->put(route('admin.payouts.update', $payout), ['status' => 'paid', 'reference' => 'REF1'])->assertRedirect();

    expect($payout->fresh()->status)->toBe(PayoutStatus::Paid)
        ->and(app(App\Actions\Finance\GetShopBalance::class)->handle($shop)['paid'])->toBe(100000);
});
