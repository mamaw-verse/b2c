<?php

declare(strict_types=1);

use App\Actions\Admin\GetPayables;
use App\Actions\Finance\CreditSellerLedger;
use App\Actions\Finance\RequestPayout;
use App\Actions\Finance\ResolvePayout;
use App\Actions\Order\ResolveReturn;
use App\Enums\OrderStatus;
use App\Enums\PayoutStatus;
use App\Models\AffiliateProfile;
use App\Models\Fulfillment;
use App\Models\LedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRefund;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('GetPayables calculates seller, customer and affiliate obligations accurately with full fixture', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $sellerA = User::factory()->create();
    $shopA = Shop::factory()->create(['user_id' => $sellerA->id, 'payout_method' => 'GCash', 'payout_account_name' => 'Seller A', 'payout_account_number' => '09171234567']);

    $sellerB = User::factory()->create();
    $shopB = Shop::factory()->create(['user_id' => $sellerB->id]);

    $buyer = User::factory()->create();
    $affiliateUser = User::factory()->create();
    $affiliateProfile = AffiliateProfile::factory()->create(['user_id' => $affiliateUser->id]);

    // 1. Order 1 for Shop A: completed sale with platform & affiliate commission
    $order1 = Order::factory()->create([
        'shop_id' => $shopA->id,
        'user_id' => $buyer->id,
        'subtotal' => 20000, // 200.00
        'total' => 20000,
        'status' => OrderStatus::Completed,
    ]);

    $orderItem1 = OrderItem::factory()->create([
        'order_id' => $order1->id,
        'unit_price' => 10000,
        'qty' => 2,
        'subtotal' => 20000,
        'commission_bps' => 500,
        'commission_amount' => 1000, // 5% platform commission = 1000 centavos
        'affiliate_profile_id' => $affiliateProfile->id,
        'affiliate_bps' => 1000,
        'affiliate_amount' => 2000, // 10% affiliate commission = 2000 centavos
    ]);

    Fulfillment::create([
        'order_id' => $order1->id,
        'courier_name' => 'J&T',
        'tracking_number' => 'JT123',
        'status' => 'delivered',
        'shipped_at' => now()->subDays(12),
        'delivered_at' => now()->subDays(10),
    ]);

    // Credit ledger for Order 1
    app(CreditSellerLedger::class)->handle($order1);

    // Make the ledger entries available immediately for testing available vs held
    LedgerEntry::where('shop_id', $shopA->id)->update(['available_at' => now()->subDay()]);

    // 2. Partial refund on Order 1: 1 unit returned (10000 centavos)
    $order1->update(['status' => OrderStatus::ReturnRefund]);
    app(ResolveReturn::class)->handle(
        seller: $sellerA,
        order: $order1,
        decision: 'approve',
        note: 'Damaged item',
        items: [['order_item_id' => $orderItem1->id, 'qty' => 1]],
    );

    // Check refund 1 is created and unprocessed
    $unprocessedRefund = OrderRefund::where('order_id', $order1->id)->first();
    expect($unprocessedRefund)->not->toBeNull()
        ->and($unprocessedRefund->amount)->toBe(10000)
        ->and($unprocessedRefund->processed_at)->toBeNull();

    // 3. Paid payout for Shop A
    // Balance before payout: 20000 - 1000 (platform) - 2000 (affiliate) - 10000 (refund) + 1000 (affiliate reversal) = 8000
    $payout = app(RequestPayout::class)->handle($shopA, 5000);
    app(ResolvePayout::class)->handle($payout, $admin, PayoutStatus::Paid, 'TRANSFER-777');

    // Balance after payout: 8000 - 5000 = 3000

    // 4. Another refund that has already been processed
    $order2 = Order::factory()->create([
        'shop_id' => $shopA->id,
        'user_id' => $buyer->id,
        'subtotal' => 4000,
        'total' => 4000,
        'status' => OrderStatus::Refunded,
    ]);
    $processedRefund = OrderRefund::factory()->processed($admin, 'REF-PAID-999')->create([
        'order_id' => $order2->id,
        'amount' => 4000,
    ]);

    // 5. Negative balance shop (Shop B)
    $shopB->ledgerEntries()->create([
        'type' => App\Enums\LedgerEntryType::Refund,
        'amount' => -2500,
        'available_at' => now()->subDay(),
    ]);

    // Execute GetPayables action
    $action = app(GetPayables::class);
    $payables = $action->handle();

    // Summary Assertions
    // Sellers: Shop A has 3000 (positive), Shop B has -2500 (negative)
    expect($payables['summary']['sellers']['owed_to_sellers'])->toBe(3000)
        ->and($payables['summary']['sellers']['owed_by_sellers'])->toBe(2500)
        ->and($payables['summary']['sellers']['available'])->toBe(3000)
        ->and($payables['summary']['sellers']['held'])->toBe(0)
        ->and($payables['summary']['sellers']['net_total'])->toBe(500);

    // Customers: only unprocessed refund (10000), processed refund (4000) is excluded
    expect($payables['summary']['customers']['total_refunds'])->toBe(10000)
        ->and($payables['summary']['customers']['pending_count'])->toBe(1)
        ->and($payables['customers']['refunds'])->toHaveCount(1)
        ->and($payables['customers']['refunds'][0]['id'])->toBe($unprocessedRefund->id)
        ->and($payables['customers']['refunds'][0]['amount'])->toBe(10000)
        ->and($payables['customers']['refunds'][0]['order_reference'])->toBe($order1->referenceNumber())
        ->and($payables['customers']['refunds'][0]['buyer']['email'])->toBe($buyer->email);

    // Affiliates: Profile had 2000 earning and 1000 reversal -> net 1000 accrued
    expect($payables['summary']['affiliates']['total_accrued'])->toBe(1000)
        ->and($payables['summary']['affiliates']['profiles_count'])->toBe(1)
        ->and($payables['affiliates']['profiles'])->toHaveCount(1)
        ->and($payables['affiliates']['profiles'][0]['id'])->toBe($affiliateProfile->id)
        ->and($payables['affiliates']['profiles'][0]['total'])->toBe(1000);

    // Shop balances check
    $shopABalance = collect($payables['sellers']['shop_balances'])->firstWhere('id', $shopA->id);
    $shopBBalance = collect($payables['sellers']['shop_balances'])->firstWhere('id', $shopB->id);

    expect($shopABalance)->not->toBeNull()
        ->and($shopABalance['total'])->toBe(3000)
        ->and($shopABalance['is_negative'])->toBeFalse()
        ->and($shopBBalance)->not->toBeNull()
        ->and($shopBBalance['total'])->toBe(-2500)
        ->and($shopBBalance['is_negative'])->toBeTrue();
});

test('admin can process a refund, double submit is a no-op, non-admin gets 404, and payables totals drop', function () {
    Illuminate\Support\Facades\Notification::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $buyer = User::factory()->create();
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $order = Order::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'subtotal' => 15000,
        'total' => 15000,
        'status' => OrderStatus::Refunded,
    ]);

    $refund = OrderRefund::factory()->create([
        'order_id' => $order->id,
        'amount' => 15000,
        'resolved_by' => $seller->id,
    ]);

    // Initial payables check: 1 pending refund of 15000
    $initialPayables = app(GetPayables::class)->handle();
    expect($initialPayables['summary']['customers']['total_refunds'])->toBe(15000)
        ->and($initialPayables['summary']['customers']['pending_count'])->toBe(1);

    // Non-admin gets 404
    $this->actingAs($buyer)
        ->put(route('admin.refunds.update', $refund), ['reference' => 'REF-999'])
        ->assertNotFound();

    // Admin validation error when reference missing
    $this->actingAs($admin)
        ->put(route('admin.refunds.update', $refund), [])
        ->assertSessionHasErrors('reference');

    // Admin processes refund
    $response = $this->actingAs($admin)
        ->put(route('admin.refunds.update', $refund), ['reference' => 'BANK-TRX-12345']);

    $response->assertRedirect(route('admin.payouts.index'));

    $refund->refresh();
    expect($refund->processed_at)->not->toBeNull()
        ->and($refund->processed_by)->toBe($admin->id)
        ->and($refund->reference)->toBe('BANK-TRX-12345');

    // Check OrderEvent
    $event = $order->events()->where('title', 'Refund processed')->first();
    expect($event)->not->toBeNull()
        ->and($event->detail)->toContain('BANK-TRX-12345');

    // Check notification
    Illuminate\Support\Facades\Notification::assertSentTo(
        $buyer,
        App\Notifications\OrderStatusNotification::class,
        fn ($notification) => $notification->title === 'Refund processed' && str_contains($notification->text, 'BANK-TRX-12345'),
    );

    // Check audit log
    $auditLog = App\Models\AuditLog::where('action', 'refund.processed')
        ->where('subject_id', $refund->id)
        ->first();
    expect($auditLog)->not->toBeNull()
        ->and($auditLog->metadata['reference'])->toBe('BANK-TRX-12345')
        ->and($auditLog->actor_id)->toBe($admin->id);

    // Double submit is a no-op
    $processedAtFirst = $refund->processed_at;
    $this->actingAs($admin)
        ->put(route('admin.refunds.update', $refund), ['reference' => 'DIFFERENT-REF'])
        ->assertRedirect(route('admin.payouts.index'));

    $refund->refresh();
    expect($refund->reference)->toBe('BANK-TRX-12345')
        ->and($refund->processed_at->timestamp)->toBe($processedAtFirst->timestamp);

    // Payables total drops to 0
    $updatedPayables = app(GetPayables::class)->handle();
    expect($updatedPayables['summary']['customers']['total_refunds'])->toBe(0)
        ->and($updatedPayables['summary']['customers']['pending_count'])->toBe(0)
        ->and($updatedPayables['customers']['refunds'])->toBeEmpty();
});
