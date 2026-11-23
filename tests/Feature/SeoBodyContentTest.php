<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Crawlable body content tests (docs/planning/14 T4.6).
 *
 * These assert the facts a crawler needs are in the initial page props, not behind a deferred
 * request. Whether the server-rendered HTML contains them also depends on Inertia SSR running
 * (T0.7), which needs an environment smoke test and is not covered here.
 */
beforeEach(function () {
    $this->shop = Shop::factory()->create([
        'user_id' => User::factory()->create()->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
    ]);
    $this->category = Category::factory()->create(['name' => 'Halal Food', 'slug' => 'halal-food', 'parent_id' => null]);
});

function bodyProduct(object $test, array $attributes = []): Product
{
    return Product::factory()->create([
        'shop_id' => $test->shop->id,
        'category_id' => $test->category->id,
        'published' => true,
        'stock' => 10,
        ...$attributes,
    ]);
}

test('category intro states the real product count, subcategories and return window', function () {
    Category::factory()->create(['name' => 'Dates', 'slug' => 'dates', 'parent_id' => $this->category->id, 'sort_order' => 1]);
    Category::factory()->create(['name' => 'Spices', 'slug' => 'spices', 'parent_id' => $this->category->id, 'sort_order' => 2]);
    bodyProduct($this);
    bodyProduct($this);
    config(['marketplace.return_window_days' => 9]);

    $intro = $this->get('/categories/halal-food')->assertOk()->viewData('page')['props']['intro'];

    expect($intro)->toContain('Browse 2 products in Halal Food')
        ->and($intro)->toContain('Narrow it down by Dates or Spices.')
        ->and($intro)->toContain('within 9 days');
});

test('category intro always reports the unfiltered count even on a halal-filtered view', function () {
    bodyProduct($this, ['halal_status' => HalalStatus::Certified]);
    bodyProduct($this, ['halal_status' => HalalStatus::NotApplicable]);

    $intro = $this->get('/categories/halal-food?halal=1')->assertOk()->viewData('page')['props']['intro'];

    expect($intro)->toContain('Browse 2 products');
});

test('an empty category says so instead of inventing a count', function () {
    $intro = $this->get('/categories/halal-food')->assertOk()->viewData('page')['props']['intro'];

    expect($intro)->toContain('no Halal Food products')
        ->and($intro)->not->toContain('Browse');
});

test('hand-written category intro copy overrides the generated text', function () {
    config(['seo.category_intros.halal-food' => 'Everyday halal pantry staples.']);

    $this->get('/categories/halal-food')->assertOk()
        ->assertInertia(fn ($page) => $page->where('intro', 'Everyday halal pantry staples.'));
});

test('product description, rating and review count are initial props, not deferred', function () {
    $product = bodyProduct($this, ['description' => 'Imported Medjool dates.', 'rating' => 4.5]);

    $page = $this->get("/products/{$product->slug}")->assertOk()->viewData('page');

    expect($page['props']['product']['description'])->toBe('Imported Medjool dates.')
        ->and($page['props']['product'])->toHaveKeys(['rating', 'review_count', 'halal_status', 'ships_from']);

    // Only the review list and related products may load after the first response.
    $deferred = collect($page['deferredProps'] ?? [])->flatten()->sort()->values()->all();
    expect($deferred)->toBe(['related', 'reviews']);
});
