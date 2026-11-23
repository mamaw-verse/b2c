<?php

declare(strict_types=1);

use App\Actions\Seo\Schema\BuildItemListNode;
use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use App\Support\Schema\JsonLdValidator;
use App\Support\Schema\SchemaId;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Structured-data policy gate (docs/planning/14 T5.1).
 *
 * Every public page must emit JSON-LD that passes JsonLdValidator: one @context + @graph, a @type on
 * every node, unique and resolvable @ids, no empty values, absolute URLs and the properties Google
 * requires for each type. The same validator powers the weekly `seo:audit` command.
 */
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
        'description' => 'Delicious imported dates from Madinah.',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 45000,
        'was_price' => 52000,
        'stock' => 25,
        'free_shipping' => true,
    ]);

    $this->variantProduct = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Ajwa Dates Gift Box',
        'slug' => 'ajwa-dates-gift-box',
        'published' => true,
        'price' => 90000,
        'stock' => 10,
    ]);
    ProductVariation::factory()->create([
        'product_id' => $this->variantProduct->id,
        'option1_value' => '1kg Box',
        'price' => 85000,
        'stock' => 10,
    ]);

    Review::factory()->create(['product_id' => $this->product->id, 'rating' => 5, 'hidden' => false]);
    Review::factory()->create(['product_id' => $this->product->id, 'rating' => 4, 'anonymous' => true, 'hidden' => false]);

    config(['marketplace.pages.returns.enabled' => true]);
});

/**
 * @return list<string>
 */
function sitewideIds(): array
{
    return [SchemaId::organization(), SchemaId::website()];
}

test('every public page passes the structured-data validator', function (string $path) {
    $result = (new JsonLdValidator)->validateHtml($this->get($path)->assertOk()->getContent(), sitewideIds());

    expect($result['errors'])->toBe([]);
})->with([
    'home' => '/',
    'product with sale price, reviews and free shipping' => '/products/premium-medjool-dates-500g',
    'product with variants' => '/products/ajwa-dates-gift-box',
    'category' => '/categories/halal-food',
    'shop' => '/shops/al-barakah-mart',
    'sellers directory' => '/sellers',
    'why choose us' => '/why-choose-us',
    'returns page' => '/pages/returns',
    'seller terms' => '/seller/terms',
]);

test('the halal verification article passes the validator', function () {
    config([
        'marketplace.pages.halal-verification.enabled' => true,
        'marketplace.pages.halal-verification.published' => '2026-01-10',
        'marketplace.pages.halal-verification.updated' => '2026-11-01',
    ]);

    $result = (new JsonLdValidator)->validateHtml($this->get('/pages/halal-verification')->assertOk()->getContent(), sitewideIds());

    expect($result['errors'])->toBe([])
        ->and($result['warnings'])->toBe([]);
});

test('a fully populated product page has no validator warnings beyond missing images', function () {
    $result = (new JsonLdValidator)->validateHtml($this->get('/products/premium-medjool-dates-500g')->assertOk()->getContent(), sitewideIds());

    // Warnings are advisory; this documents which ones the factory fixture is allowed to produce.
    foreach ($result['warnings'] as $warning) {
        expect($warning)->toContain('has no image');
    }
});

test('the validator reports a regression when a builder drops a required field', function () {
    $html = $this->get('/products/premium-medjool-dates-500g')->assertOk()->getContent();

    // Simulate a broken builder: strip the offer currency from the rendered JSON-LD.
    $broken = str_replace('"priceCurrency":"PHP"', '"priceCurrency":""', $html);

    expect($broken)->not->toBe($html);

    $result = (new JsonLdValidator)->validateHtml($broken, sitewideIds());

    expect($result['errors'])->not->toBeEmpty();
});

test('list stubs are not mistaken for full products by the validator', function () {
    $node = resolve(BuildItemListNode::class)->handle('http://localhost:8000/categories/halal-food', [[
        'url' => 'http://localhost:8000/products/premium-medjool-dates-500g',
        'name' => 'Premium Medjool Dates 500g',
        'type' => 'Product',
        'id' => SchemaId::product('premium-medjool-dates-500g'),
    ]]);

    $result = (new JsonLdValidator)->validateDocument(['@context' => 'https://schema.org', '@graph' => [$node]]);

    expect($result['errors'])->toBe([]);
});
