<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Support\SeoData;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->shop = Shop::factory()->create([
        'user_id' => User::factory()->create()->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
        'name' => 'Al-Barakah Mart',
        'slug' => 'al-barakah-mart',
        'city' => 'Cotabato City',
    ]);
    $this->category = Category::factory()->create(['name' => 'Halal Food', 'slug' => 'halal-food']);
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Premium Medjool Dates 500g',
        'slug' => 'premium-medjool-dates-500g',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 45000,
        'was_price' => null,
        'stock' => 10,
    ]);
});

test('every indexable page allows large previews and unrestricted snippets', function (string $path) {
    $this->get($path)
        ->assertOk()
        ->assertSee('<meta name="robots" content="'.SeoData::INDEXABLE_ROBOTS.'">', false);
})->with(['/', '/products/premium-medjool-dates-500g', '/categories/halal-food', '/shops/al-barakah-mart', '/sellers', '/why-choose-us', '/seller/terms']);

test('noindex pages never receive the preview directives', function () {
    $this->get('/search')->assertOk()->assertSee('<meta name="robots" content="noindex, follow">', false);
});

test('og:image:secure_url mirrors og:image only for https images', function () {
    config(['app.url' => 'https://halalbenta.test']);

    $this->get('/')->assertOk()->assertSee('<meta property="og:image:secure_url" content="https://halalbenta.test/social/default-og.jpg">', false);

    config(['app.url' => 'http://localhost:8000']);

    $this->get('/')->assertOk()->assertDontSee('og:image:secure_url', false);
});

test('product pages expose og:updated_time and product:category', function () {
    $response = $this->get('/products/premium-medjool-dates-500g')->assertOk();

    $response->assertSee('<meta property="og:updated_time" content="'.$this->product->fresh()->updated_at->toIso8601String().'">', false)
        ->assertSee('<meta property="product:category" content="Halal Food">', false)
        ->assertDontSee('product:sale_price:amount', false);
});

test('a discounted product advertises the list price and the sale price separately', function () {
    $this->product->forceFill(['was_price' => 60000])->save();

    $this->get('/products/premium-medjool-dates-500g')->assertOk()
        ->assertSee('<meta property="product:price:amount" content="600.00">', false)
        ->assertSee('<meta property="product:sale_price:amount" content="450.00">', false)
        ->assertSee('<meta property="product:sale_price:currency" content="PHP">', false);
});

test('twitter:site appears only when a handle is configured', function () {
    $this->get('/')->assertOk()->assertDontSee('twitter:site', false);

    config(['seo.twitter_handle' => 'halalbenta']);

    $this->get('/')->assertOk()->assertSee('<meta name="twitter:site" content="@halalbenta">', false);
});

test('shops and categories get twitter labels like products do', function () {
    $this->get('/shops/al-barakah-mart')->assertOk()
        ->assertSee('<meta name="twitter:label1" content="Location">', false)
        ->assertSee('<meta name="twitter:data1" content="Cotabato City">', false);

    $this->get('/categories/halal-food')->assertOk()
        ->assertSee('<meta name="twitter:label1" content="Items">', false);
});

test('the halal verification page is typed as an article', function () {
    config(['marketplace.pages.halal-verification.enabled' => true]);

    $this->get('/pages/halal-verification')->assertOk()
        ->assertSee('<meta property="og:type" content="article">', false);
});
