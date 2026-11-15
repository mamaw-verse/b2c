<?php

declare(strict_types=1);

use App\Actions\Seller\GetProductShareBreakdown;
use App\Enums\HalalStatus;
use App\Enums\ShopStaffStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductShareStat;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->owner->id,
        'status' => 'approved',
    ]);

    $this->staff = User::factory()->create();
    ShopStaff::factory()->create([
        'shop_id' => $this->shop->id,
        'user_id' => $this->staff->id,
        'email' => $this->staff->email,
        'status' => ShopStaffStatus::Active,
        'invited_by' => $this->owner->id,
        'accepted_at' => now(),
    ]);

    $this->otherOwner = User::factory()->create();
    $this->otherShop = Shop::factory()->create([
        'user_id' => $this->otherOwner->id,
        'status' => 'approved',
    ]);

    $this->category = Category::factory()->create();
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'share_count' => 12,
    ]);

    Config::set('marketplace.features.product_share_enabled', true);
});

test('seller product list includes denormalised share_count', function () {
    $this->actingAs($this->owner)
        ->get(route('seller.products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/index')
            ->where('products.data.0.id', $this->product->id)
            ->where('products.data.0.share_count', 12)
        );
});

test('breakdown excludes rows older than 30 days from recent', function () {
    // 10 shares today on facebook
    ProductShareStat::factory()->create([
        'product_id' => $this->product->id,
        'channel' => 'facebook',
        'shared_on' => today()->toDateString(),
        'count' => 10,
    ]);

    // 5 shares 10 days ago on copy
    ProductShareStat::factory()->create([
        'product_id' => $this->product->id,
        'channel' => 'copy',
        'shared_on' => today()->subDays(10)->toDateString(),
        'count' => 5,
    ]);

    // 20 shares 45 days ago on facebook (older than 30 days)
    ProductShareStat::factory()->create([
        'product_id' => $this->product->id,
        'channel' => 'facebook',
        'shared_on' => today()->subDays(45)->toDateString(),
        'count' => 20,
    ]);

    $action = app(GetProductShareBreakdown::class);
    $breakdown = $action->handle($this->product, 30);

    expect($breakdown['total'])->toBe(35)
        ->and($breakdown['recent'])->toBe(15)
        ->and($breakdown['by_channel']['facebook']['all'])->toBe(30)
        ->and($breakdown['by_channel']['facebook']['recent'])->toBe(10)
        ->and($breakdown['by_channel']['copy']['all'])->toBe(5)
        ->and($breakdown['by_channel']['copy']['recent'])->toBe(5);
});

test('owner and staff of the shop see sharing stats on edit page', function () {
    ProductShareStat::factory()->create([
        'product_id' => $this->product->id,
        'channel' => 'facebook',
        'shared_on' => today()->toDateString(),
        'count' => 7,
    ]);

    // Owner
    $this->actingAs($this->owner)
        ->get(route('seller.products.edit', $this->product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/form')
            ->where('sharing.total', 7)
            ->where('sharing.recent', 7)
        );

    // Staff
    $this->actingAs($this->staff)
        ->get(route('seller.products.edit', $this->product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/form')
            ->where('sharing.total', 7)
            ->where('sharing.recent', 7)
        );
});

test('owner of another shop receives 404 on edit page', function () {
    $this->actingAs($this->otherOwner)
        ->get(route('seller.products.edit', $this->product))
        ->assertNotFound();
});

test('disabled feature flag returns null for sharing on edit page', function () {
    Config::set('marketplace.features.product_share_enabled', false);

    $this->actingAs($this->owner)
        ->get(route('seller.products.edit', $this->product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/products/form')
            ->where('sharing', null)
        );
});
