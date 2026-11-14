<?php

declare(strict_types=1);

use App\Actions\Account\ActivateAffiliateProfile;
use App\Actions\Cart\PlaceOrder;
use App\Actions\Finance\CreditSellerLedger;
use App\Actions\Order\ResolveReturn;
use App\Enums\AffiliateEarningStatus;
use App\Enums\AffiliateProfileStatus;
use App\Enums\HalalStatus;
use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\AffiliateEarning;
use App\Models\AffiliateProfile;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can activate an affiliate profile', function () {
    $user = User::factory()->create();
    $action = app(ActivateAffiliateProfile::class);

    $profile = $action->handle($user);

    expect($profile)->toBeInstanceOf(AffiliateProfile::class)
        ->and($profile->user_id)->toBe($user->id)
        ->and($profile->status)->toBe(AffiliateProfileStatus::Active)
        ->and($profile->code)->not->toBeEmpty();
});

test('buyer affiliate page can be viewed and activated', function () {
    $buyer = User::factory()->create();

    $response = $this->actingAs($buyer)->get(route('account.affiliate.index'));
    $response->assertOk();

    // Activate profile
    $postResponse = $this->actingAs($buyer)->post(route('account.affiliate.store'));
    $postResponse->assertRedirect(route('account.affiliate.index'));

    expect($buyer->refresh()->affiliateProfile)->not->toBeNull();
});

test('affiliate referral cookie is captured by middleware', function () {
    $affiliateUser = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['user_id' => $affiliateUser->id]);

    $response = $this->get('/?ref='.$profile->code);
    $response->assertCookie('affiliate_ref', $profile->code);
});

test('order snapshot captures affiliate commission for eligible products only', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $buyer = User::factory()->create();
    $affiliateUser = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['user_id' => $affiliateUser->id, 'code' => 'TESTAFF1']);

    $p1 = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 10000,
        'stock' => 10,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => 1000, // 10%
    ]);

    $p2 = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 5000,
        'stock' => 10,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
        'affiliate_enabled' => false, // disabled
    ]);

    CartItem::create(['user_id' => $buyer->id, 'product_id' => $p1->id, 'qty' => 1, 'selected' => true]);
    CartItem::create(['user_id' => $buyer->id, 'product_id' => $p2->id, 'qty' => 1, 'selected' => true]);

    $address = Address::factory()->create(['user_id' => $buyer->id]);
    $shipping = ShippingOption::factory()->create();

    $action = app(PlaceOrder::class);
    $order = $action->handle(
        user: $buyer,
        address: $address,
        shippingOption: $shipping,
        paymentMethod: 'cod',
        affiliateCode: 'TESTAFF1',
    );

    assert($order instanceof Order);

    $item1 = $order->items->firstWhere('product_id', $p1->id);
    $item2 = $order->items->firstWhere('product_id', $p2->id);

    expect($item1->affiliate_profile_id)->toBe($profile->id)
        ->and($item1->affiliate_bps)->toBe(1000)
        ->and($item1->affiliate_amount)->toBe(1000) // 10% of 10000 = 1000 centavos
        ->and($item2->affiliate_profile_id)->toBeNull()
        ->and($item2->affiliate_amount)->toBe(0);
});

test('no self-referral: buyer, shop owner, and shop staff cannot earn affiliate commission', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);

    $staffUser = User::factory()->create();
    ShopStaff::factory()->active()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser->id,
        'email' => $staffUser->email,
    ]);

    $buyer = User::factory()->create();

    $buyerProfile = AffiliateProfile::factory()->create(['user_id' => $buyer->id, 'code' => 'BUYER1']);
    $sellerProfile = AffiliateProfile::factory()->create(['user_id' => $seller->id, 'code' => 'SELLER1']);
    $staffProfile = AffiliateProfile::factory()->create(['user_id' => $staffUser->id, 'code' => 'STAFF1']);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 10000,
        'stock' => 10,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => 1000,
    ]);

    $address = Address::factory()->create(['user_id' => $buyer->id]);
    $shipping = ShippingOption::factory()->create();
    $action = app(PlaceOrder::class);

    // Case 1: Buyer referred themself
    CartItem::create(['user_id' => $buyer->id, 'product_id' => $product->id, 'qty' => 1, 'selected' => true]);
    $order1 = $action->handle(user: $buyer, address: $address, shippingOption: $shipping, paymentMethod: 'cod', affiliateCode: 'BUYER1');
    assert($order1 instanceof Order);
    expect($order1->items->first()->affiliate_profile_id)->toBeNull();

    // Case 2: Shop owner referral
    $product->update(['stock' => 10]);
    CartItem::create(['user_id' => $buyer->id, 'product_id' => $product->id, 'qty' => 1, 'selected' => true]);
    $order2 = $action->handle(user: $buyer, address: $address, shippingOption: $shipping, paymentMethod: 'cod', affiliateCode: 'SELLER1');
    assert($order2 instanceof Order);
    expect($order2->items->first()->affiliate_profile_id)->toBeNull();

    // Case 3: Staff referral for the shop they operate
    $product->update(['stock' => 10]);
    CartItem::create(['user_id' => $buyer->id, 'product_id' => $product->id, 'qty' => 1, 'selected' => true]);
    $order3 = $action->handle(user: $buyer, address: $address, shippingOption: $shipping, paymentMethod: 'cod', affiliateCode: 'STAFF1');
    assert($order3 instanceof Order);
    expect($order3->items->first()->affiliate_profile_id)->toBeNull();
});

test('snapshot remains unchanged if seller subsequently modifies affiliate rate', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['code' => 'PROMO1']);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 10000,
        'stock' => 10,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => 1000,
    ]);

    CartItem::create(['user_id' => $buyer->id, 'product_id' => $product->id, 'qty' => 1, 'selected' => true]);
    $address = Address::factory()->create(['user_id' => $buyer->id]);
    $shipping = ShippingOption::factory()->create();

    $order = app(PlaceOrder::class)->handle(user: $buyer, address: $address, shippingOption: $shipping, paymentMethod: 'cod', affiliateCode: 'PROMO1');
    assert($order instanceof Order);

    // Seller disables affiliate or lowers rate
    $product->update(['affiliate_enabled' => false, 'affiliate_commission_bps' => 200]);

    $item = $order->items->first()->fresh();
    expect($item->affiliate_profile_id)->toBe($profile->id)
        ->and($item->affiliate_bps)->toBe(1000)
        ->and($item->affiliate_amount)->toBe(1000);
});

test('order completion credits affiliate commission to ledger and accrues earnings', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();
    $profile = AffiliateProfile::factory()->create(['code' => 'AFF1']);

    $order = Order::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'subtotal' => 10000,
        'status' => OrderStatus::ToReceive,
    ]);

    $item = OrderItem::factory()->create([
        'order_id' => $order->id,
        'unit_price' => 10000,
        'qty' => 1,
        'subtotal' => 10000,
        'commission_bps' => 500,
        'commission_amount' => 500,
        'affiliate_profile_id' => $profile->id,
        'affiliate_bps' => 800,
        'affiliate_amount' => 800,
    ]);

    $creditLedger = app(CreditSellerLedger::class);
    $creditLedger->handle($order);

    // Ledger check
    $affiliateEntry = $order->ledgerEntries()->where('type', LedgerEntryType::AffiliateCommission)->first();
    expect($affiliateEntry)->not->toBeNull()
        ->and($affiliateEntry->amount)->toBe(-800);

    // Accrual check
    $earning = AffiliateEarning::where('order_item_id', $item->id)->first();
    expect($earning)->not->toBeNull()
        ->and($earning->affiliate_profile_id)->toBe($profile->id)
        ->and($earning->amount)->toBe(800)
        ->and($earning->status)->toBe(AffiliateEarningStatus::Pending);

    // Idempotent execution
    $creditLedger->handle($order);
    expect($order->ledgerEntries()->where('type', LedgerEntryType::AffiliateCommission)->count())->toBe(1)
        ->and(AffiliateEarning::where('order_item_id', $item->id)->count())->toBe(1);
});

test('ResolveReturn proportionally reverses affiliate commission and records cancelled earning', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $buyer = User::factory()->create();
    $profile = AffiliateProfile::factory()->create();

    $order = Order::factory()->create([
        'shop_id' => $shop->id,
        'user_id' => $buyer->id,
        'subtotal' => 20000,
        'status' => OrderStatus::ReturnRefund,
    ]);

    $item = OrderItem::factory()->create([
        'order_id' => $order->id,
        'unit_price' => 10000,
        'qty' => 2,
        'subtotal' => 20000,
        'affiliate_profile_id' => $profile->id,
        'affiliate_bps' => 1000,
        'affiliate_amount' => 2000, // 2000 centavos total for 2 units
    ]);

    $resolveReturn = app(ResolveReturn::class);
    $resolveReturn->handle(
        seller: $seller,
        order: $order,
        decision: 'approve',
        items: [['order_item_id' => $item->id, 'qty' => 1]],
    );

    // Check shop ledger adjustment (credited back 1000 centavos)
    $adjustment = $order->ledgerEntries()->where('type', LedgerEntryType::Adjustment)->first();
    expect($adjustment)->not->toBeNull()
        ->and($adjustment->amount)->toBe(1000);

    // Check cancelled affiliate earning of -1000
    $cancelledEarning = AffiliateEarning::where('order_item_id', $item->id)
        ->where('status', AffiliateEarningStatus::Cancelled)
        ->first();

    expect($cancelledEarning)->not->toBeNull()
        ->and($cancelledEarning->amount)->toBe(-1000);
});
