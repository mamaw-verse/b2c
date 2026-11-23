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

test('content pages and article pages expose author meta tag', function () {
    config(['marketplace.pages.halal-verification.enabled' => true]);

    $this->get('/pages/halal-verification')->assertOk()
        ->assertSee('<meta name="author" content="HalalBenta Halal Assurance Team">', false)
        ->assertSee('<meta property="article:author" content="HalalBenta Halal Assurance Team">', false);

    $this->get('/why-choose-us')->assertOk()
        ->assertSee('<meta name="author" content="HalalBenta">', false);

    $this->get('/seller/terms')->assertOk()
        ->assertSee('<meta name="author" content="HalalBenta Legal &amp; Compliance">', false);
});

test('favicon, apple-touch-icon, and app manifest signals are configured correctly', function () {
    $this->get('/')->assertOk()
        ->assertSee('<meta name="application-name" content="HalalBenta">', false)
        ->assertSee('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">', false)
        ->assertSee('<link rel="apple-touch-icon" href="/apple-touch-icon.png">', false)
        ->assertSee('<link rel="manifest" href="/manifest.webmanifest">', false);

    expect(file_exists(public_path('favicon-32x32.png')))->toBeTrue()
        ->and(file_exists(public_path('apple-touch-icon.png')))->toBeTrue()
        ->and(file_exists(public_path('manifest.webmanifest')))->toBeTrue();

    $manifest = json_decode((string) file_get_contents(public_path('manifest.webmanifest')), true, flags: JSON_THROW_ON_ERROR);
    expect($manifest['id'])->toBe('/')
        ->and($manifest['lang'])->toBe('en-PH')
        ->and($manifest['categories'])->toContain('shopping');
});

test('product og:image prefers the uploaded product photo when present', function () {
    App\Models\ProductImage::factory()->create([
        'product_id' => $this->product->id,
        'url' => 'https://example.com/photos/dates.jpg',
        'sort_order' => 1,
    ]);

    $this->get('/products/premium-medjool-dates-500g')->assertOk()
        ->assertSee('<meta property="og:image" content="https://example.com/photos/dates.jpg">', false)
        ->assertSee('<meta name="twitter:image" content="https://example.com/photos/dates.jpg">', false);
});

test('product og:image falls back to generated card when no photo is uploaded', function () {
    $this->get('/products/premium-medjool-dates-500g')->assertOk()
        ->assertSee('/social/product/premium-medjool-dates-500g.jpg', false);
});

test('product og:image uses generated card when prefer_photo_og is disabled', function () {
    App\Models\ProductImage::factory()->create([
        'product_id' => $this->product->id,
        'url' => 'https://example.com/photos/dates.jpg',
        'sort_order' => 1,
    ]);

    config(['seo.prefer_photo_og.product' => false]);

    $this->get('/products/premium-medjool-dates-500g')->assertOk()
        ->assertSee('/social/product/premium-medjool-dates-500g.jpg', false);
});
