<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
    ]);
    $this->category = Category::factory()->create();
});

test('share prop enabled follows the feature flag', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'share_count' => 0,
    ]);

    Config::set('marketplace.features.product_share_enabled', false);

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('share.enabled', false)
            ->where('share.count', null)
        );

    Config::set('marketplace.features.product_share_enabled', true);

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('share.enabled', true)
        );
});

test('share prop count is null below public_min and integer at or above it', function () {
    Config::set('marketplace.features.product_share_enabled', true);
    Config::set('marketplace.share.public_min', 5);

    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'share_count' => 4,
    ]);

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('share.count', null)
        );

    $product->forceFill(['share_count' => 5])->save();

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('share.count', 5)
        );
});

test('share.url always provides the clean canonical product URL without tracking parameters', function () {
    Config::set('marketplace.features.product_share_enabled', true);

    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'halal_status' => HalalStatus::Certified,
    ]);

    $cleanUrl = route('products.show', $product);
    $dirtyUrl = $cleanUrl.'?utm_source=facebook&utm_medium=cpc&fbclid=abc123xyz&ref=partner_123';

    $this->get($dirtyUrl)
        ->assertOk()
        ->assertSee('<link rel="canonical" href="'.$cleanUrl.'">', false)
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('share.url', $cleanUrl)
        );
});
