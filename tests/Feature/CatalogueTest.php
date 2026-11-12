<?php

declare(strict_types=1);

use App\Models\Category;
use App\Models\HalalCertification;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('home renders the storefront with categories and products', function () {
    $category = Category::factory()->create();
    Product::factory()->certified()->create(['category_id' => $category->id]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('categories')
            ->has('products.data')
            ->has('halalCertificationUrl')
            ->has('b2bUrl'));
});

test('search returns matching products and hides non-buyer statuses', function () {
    $category = Category::factory()->create();
    Product::factory()->certified()->create(['category_id' => $category->id, 'name' => 'Ajwa dates premium']);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Travel prayer mat']);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Ajwa under review', 'halal_status' => 'review']);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Ajwa expired cert', 'halal_status' => 'expired']);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Ajwa unpublished', 'published' => false]);

    $this->get(route('search', ['q' => 'ajwa']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('search')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Ajwa dates premium'));
});

test('search applies the halal certified filter by default', function () {
    $category = Category::factory()->create();
    Product::factory()->certified()->create(['category_id' => $category->id, 'name' => 'Certified item']);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Plain item']);

    $this->get(route('search', ['halal' => '0']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('products.data', 2));

    $this->get(route('search'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Certified item'));
});

test('product detail shows halal certification', function () {
    $product = Product::factory()->certified()->create();
    HalalCertification::factory()->create([
        'certifiable_type' => $product->getMorphClass(),
        'certifiable_id' => $product->id,
    ]);

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->where('product.slug', $product->slug)
            ->where('product.halal_status', 'certified')
            ->has('product.certification'));
});

test('hidden products are not found', function (string $status) {
    $product = Product::factory()->create(['halal_status' => $status]);

    $this->get(route('products.show', $product))->assertNotFound();
})->with(['review', 'expired', 'missing']);

test('unpublished products are not found', function () {
    $product = Product::factory()->create(['published' => false]);

    $this->get(route('products.show', $product))->assertNotFound();
});

test('category page lists visible products including children', function () {
    $parent = Category::factory()->create();
    $child = Category::factory()->create(['parent_id' => $parent->id]);
    Product::factory()->create(['category_id' => $child->id]);
    Product::factory()->create(['halal_status' => 'expired', 'category_id' => $child->id]);

    $this->get(route('categories.show', $parent))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('category')
            ->has('products.data', 1));
});

test('shop page renders shop stats and products', function () {
    $shop = Shop::factory()->create(['verification' => 'official', 'halal_only' => true]);
    Product::factory()->count(2)->create(['shop_id' => $shop->id]);

    $this->get(route('shops.show', $shop))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shop')
            ->where('shop.slug', $shop->slug)
            ->where('shop.verification', 'official')
            ->where('shop.products_count', 2)
            ->has('products.data', 2));
});

test('category halal filter returns only certified products and a real total', function () {
    $category = Category::factory()->create();
    Product::factory()->certified()->count(2)->create(['category_id' => $category->id]);
    Product::factory()->create(['category_id' => $category->id]);

    $this->get(route('categories.show', ['category' => $category, 'halal' => 1]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('category')
            ->where('filters.halal', true)
            ->where('total', 2)
            ->has('products.data', 2)
            ->where('products.data.0.halal_status', 'certified'));
});

test('category sort falls back to default and page reports total', function () {
    $category = Category::factory()->create();
    Product::factory()->count(3)->create(['category_id' => $category->id]);

    $this->get(route('categories.show', ['category' => $category, 'sort' => 'bogus']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.sort', 'top_sales')
            ->where('total', 3));
});

test('category filters products by price sort', function () {
    $category = Category::factory()->create();
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Cheap item', 'price' => 100]);
    Product::factory()->create(['category_id' => $category->id, 'name' => 'Pricey item', 'price' => 90000]);

    $this->get(route('categories.show', ['category' => $category, 'sort' => 'price_asc']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.data.0.name', 'Cheap item'));
});
