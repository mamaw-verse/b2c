<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
    ]);
    $this->category = Category::factory()->create();
});

test('published product response HTML contains link-preview meta tags with slug URL and absolute image URL', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Organic Medjool Dates',
        'description' => 'Sweet and delicious high quality dates from Medina.',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 34900,
    ]);

    ProductImage::factory()->create([
        'product_id' => $product->id,
        'url' => 'https://example.com/photos/dates.jpg',
        'sort_order' => 1,
    ]);

    $url = route('products.show', $product);

    $response = $this->get($url);

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="'.$url.'">', false);
    $response->assertSee('Sweet and delicious high quality dates from Medina', false);
    $response->assertSee('<meta property="og:type" content="product">', false);
    $response->assertSee('Organic Medjool Dates', false);
    $response->assertSee('<meta property="og:site_name" content="HalalBenta">', false);
    $response->assertSee('<meta property="og:locale" content="en_PH">', false);
    $response->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
    $response->assertSee('<meta property="product:price:amount" content="349.00">', false);
    $response->assertSee('<meta property="product:price:currency" content="PHP">', false);
    $response->assertSee('<meta property="product:availability" content="in stock">', false);
    $response->assertSee('<meta name="twitter:label1" content="Price">', false);
    $response->assertSee('<meta name="twitter:data1" content="₱349">', false);
});

test('no-photo product falls back to social card in meta tags', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Plain Dates',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
    ]);

    $response = $this->get(route('products.show', $product));

    $response->assertOk();
    $response->assertSee('/social/product/'.$product->slug.'.jpg', false);
});

test('a product description containing html and script is stripped and escaped in meta tags', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Safe Product',
        'description' => '<p>Good <script>alert("xss")</script> <b>food</b></p>',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
    ]);

    $response = $this->get(route('products.show', $product));

    $response->assertOk();
    $response->assertDontSee('<script>alert("xss")</script>', false);
    $response->assertSee('Good alert(&quot;xss&quot;) food', false);
});

test('unpublished product returns 404 and does not emit meta tags', function () {
    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Draft Product',
        'published' => false,
        'halal_status' => HalalStatus::Certified,
    ]);

    $response = $this->get(route('products.show', $product));

    $response->assertNotFound();
});
