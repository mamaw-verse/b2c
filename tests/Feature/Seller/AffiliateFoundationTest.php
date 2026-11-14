<?php

declare(strict_types=1);

use App\Actions\Seller\ResolveAffiliateRate;
use App\Enums\HalalStatus;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('product has affiliate attributes and factory state', function () {
    $product = Product::factory()->create();

    expect($product->affiliate_enabled)->toBeFalse()
        ->and($product->affiliate_commission_bps)->toBeNull();

    $enabledProduct = Product::factory()->affiliateEnabled()->create();

    expect($enabledProduct->affiliate_enabled)->toBeTrue()
        ->and($enabledProduct->affiliate_commission_bps)->toBe(500);
});

test('marketplace config contains affiliate boundaries', function () {
    expect(config('marketplace.affiliate.default_bps'))->toBe(500)
        ->and(config('marketplace.affiliate.min_bps'))->toBe(100)
        ->and(config('marketplace.affiliate.max_bps'))->toBe(3000);
});

test('ResolveAffiliateRate returns null when affiliate is disabled', function () {
    $action = app(ResolveAffiliateRate::class);
    $shop = Shop::factory()->create();
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => false,
        'affiliate_commission_bps' => 700,
    ]);

    expect($action->handle($product))->toBeNull();
});

test('ResolveAffiliateRate returns product rate when enabled', function () {
    $action = app(ResolveAffiliateRate::class);
    $shop = Shop::factory()->create();
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => 750,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    expect($action->handle($product))->toBe(750);
});

test('ResolveAffiliateRate returns platform default when product rate is null', function () {
    $action = app(ResolveAffiliateRate::class);
    $shop = Shop::factory()->create();
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => null,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    expect($action->handle($product))->toBe(500);
});

test('ResolveAffiliateRate returns null when product is unpublished or hidden', function () {
    $action = app(ResolveAffiliateRate::class);
    $shop = Shop::factory()->create();

    $unpublished = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => false,
        'hidden' => false,
    ]);

    $hidden = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => true,
    ]);

    expect($action->handle($unpublished))->toBeNull()
        ->and($action->handle($hidden))->toBeNull();
});

test('ResolveAffiliateRate returns null when shop is suspended or unapproved', function () {
    $action = app(ResolveAffiliateRate::class);

    $suspendedShop = Shop::factory()->create(['suspended' => true]);
    $productOnSuspended = Product::factory()->create([
        'shop_id' => $suspendedShop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
    ]);

    $pendingShop = Shop::factory()->pending()->create();
    $productOnPending = Product::factory()->create([
        'shop_id' => $pendingShop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
    ]);

    expect($action->handle($productOnSuspended))->toBeNull()
        ->and($action->handle($productOnPending))->toBeNull();
});

test('ResolveAffiliateRate returns null when halal status is not visible to buyers', function () {
    $action = app(ResolveAffiliateRate::class);
    $shop = Shop::factory()->create();

    $reviewProduct = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Review,
    ]);

    expect($action->handle($reviewProduct))->toBeNull();
});

test('Product affiliateEligible scope only matches eligible products', function () {
    $shop = Shop::factory()->create();
    $suspendedShop = Shop::factory()->create(['suspended' => true]);

    $eligible = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $disabled = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => false,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $unpublished = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => false,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $hidden = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => true,
        'halal_status' => HalalStatus::Certified,
    ]);

    $suspended = Product::factory()->create([
        'shop_id' => $suspendedShop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $reviewHalal = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'published' => true,
        'hidden' => false,
        'halal_status' => HalalStatus::Review,
    ]);

    $matchedIds = Product::affiliateEligible()->pluck('id')->all();

    expect($matchedIds)->toContain($eligible->id)
        ->and($matchedIds)->not->toContain($disabled->id)
        ->and($matchedIds)->not->toContain($unpublished->id)
        ->and($matchedIds)->not->toContain($hidden->id)
        ->and($matchedIds)->not->toContain($suspended->id)
        ->and($matchedIds)->not->toContain($reviewHalal->id);
});

test('owner can bulk enable and disable affiliate for shop products', function () {
    $owner = App\Models\User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $p1 = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => false,
        'affiliate_commission_bps' => null,
    ]);
    $p2 = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => false,
        'affiliate_commission_bps' => 1200,
    ]);

    // Bulk enable
    $response = $this->actingAs($owner)->post(route('seller.products.bulk-affiliate.store'), [
        'product_ids' => [$p1->id, $p2->id],
        'enabled' => true,
    ]);

    $response->assertRedirect();

    $p1->refresh();
    $p2->refresh();

    expect($p1->affiliate_enabled)->toBeTrue()
        ->and($p1->affiliate_commission_bps)->toBe(500) // assigned platform default
        ->and($p2->affiliate_enabled)->toBeTrue()
        ->and($p2->affiliate_commission_bps)->toBe(1200); // kept custom rate

    // Bulk disable
    $response = $this->actingAs($owner)->post(route('seller.products.bulk-affiliate.store'), [
        'product_ids' => [$p1->id, $p2->id],
        'enabled' => false,
    ]);

    $response->assertRedirect();

    $p1->refresh();
    $p2->refresh();

    expect($p1->affiliate_enabled)->toBeFalse()
        ->and($p1->affiliate_commission_bps)->toBe(500) // rate preserved
        ->and($p2->affiliate_enabled)->toBeFalse()
        ->and($p2->affiliate_commission_bps)->toBe(1200);
});

test('staff cannot bulk update affiliate settings', function () {
    $owner = App\Models\User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);
    $staffUser = App\Models\User::factory()->create();

    App\Models\ShopStaff::factory()->active()->create([
        'shop_id' => $shop->id,
        'user_id' => $staffUser->id,
        'email' => $staffUser->email,
    ]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => false,
    ]);

    $response = $this->actingAs($staffUser)->post(route('seller.products.bulk-affiliate.store'), [
        'product_ids' => [$product->id],
        'enabled' => true,
    ]);

    $response->assertNotFound();
});

test('bulk affiliate fails validation when product belongs to another shop', function () {
    $owner = App\Models\User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $owner->id]);

    $otherShop = Shop::factory()->create();
    $otherProduct = Product::factory()->create(['shop_id' => $otherShop->id]);

    $response = $this->actingAs($owner)->post(route('seller.products.bulk-affiliate.store'), [
        'product_ids' => [$otherProduct->id],
        'enabled' => true,
    ]);

    $response->assertSessionHasErrors(['product_ids.0']);
});

test('ListSellerProducts includes affiliate attributes', function () {
    $shop = Shop::factory()->create();
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'affiliate_enabled' => true,
        'affiliate_commission_bps' => 850,
    ]);

    $action = app(App\Actions\Seller\ListSellerProducts::class);
    $paginated = $action->handle($shop);

    $item = collect($paginated->items())->firstWhere('id', $product->id);

    expect($item)->not->toBeNull()
        ->and($item['affiliate_enabled'])->toBeTrue()
        ->and($item['affiliate_commission_bps'])->toBe(850);
});
