<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\HalalCertification;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;

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
    $this->parent = Category::factory()->create(['name' => 'Halal Food', 'slug' => 'halal-food']);
    $this->category = Category::factory()->create(['name' => 'Dates', 'slug' => 'dates', 'parent_id' => $this->parent->id]);
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Premium Medjool Dates 500g',
        'slug' => 'premium-medjool-dates-500g',
        'description' => str_repeat('Imported Medjool dates from Madinah, soft and rich in fiber. ', 8),
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 45000,
        'was_price' => null,
        'stock' => 25,
        'free_shipping' => false,
        'weight' => 0.5,
        'ingredients' => 'Medjool dates',
    ]);
});

/**
 * @return array<int, array<string, mixed>>
 */
function schemaNodes(TestResponse $response): array
{
    preg_match_all('#<script type="application/ld\+json">\s*(.*?)\s*</script>#s', (string) $response->getContent(), $matches);
    expect($matches[1])->toHaveCount(1);

    $document = json_decode($matches[1][0], true, flags: JSON_THROW_ON_ERROR);

    return $document['@graph'];
}

/**
 * @return array<string, mixed>
 */
function productNode(TestResponse $response): array
{
    $node = collect(schemaNodes($response))->first(fn (array $n) => in_array($n['@type'], ['Product', 'ProductGroup'], true));
    expect($node)->not->toBeNull();

    return $node;
}

test('product offer carries visible price, availability, condition and the configured return window', function () {
    config(['marketplace.return_window_days' => 14]);

    $product = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());
    $offer = $product['offers'];

    expect($product['@type'])->toBe('Product')
        ->and($offer['price'])->toBe('450.00')
        ->and($offer['priceCurrency'])->toBe('PHP')
        ->and($offer['availability'])->toBe('https://schema.org/InStock')
        ->and($offer['itemCondition'])->toBe('https://schema.org/NewCondition')
        ->and($offer['hasMerchantReturnPolicy']['merchantReturnDays'])->toBe(14)
        ->and($offer['hasMerchantReturnPolicy']['returnPolicyCategory'])->toBe('https://schema.org/MerchantReturnFiniteReturnWindow')
        ->and($offer['hasMerchantReturnPolicy']['applicableCountry'])->toBe('PH')
        ->and($offer)->not->toHaveKey('priceValidUntil');
});

test('a zero day return window is published as returns not permitted', function () {
    config(['marketplace.return_window_days' => 0]);

    $offer = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk())['offers'];

    expect($offer['hasMerchantReturnPolicy']['returnPolicyCategory'])->toBe('https://schema.org/MerchantReturnNotPermitted')
        ->and($offer['hasMerchantReturnPolicy'])->not->toHaveKey('merchantReturnDays');
});

test('free shipping publishes a zero shipping rate, otherwise no shipping details are invented', function () {
    $paid = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());
    expect($paid['offers'])->not->toHaveKey('shippingDetails');

    $this->product->forceFill(['free_shipping' => true])->save();
    $free = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());

    expect($free['offers']['shippingDetails']['shippingRate']['value'])->toBe('0.00')
        ->and($free['offers']['shippingDetails']['shippingRate']['currency'])->toBe('PHP')
        ->and($free['offers']['shippingDetails']['shippingDestination']['addressCountry'])->toBe('PH');
});

test('a sale price is represented as a strikethrough price specification', function () {
    $this->product->forceFill(['was_price' => 60000])->save();

    $offer = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk())['offers'];

    expect($offer['price'])->toBe('450.00')
        ->and($offer['priceSpecification']['price'])->toBe('600.00')
        ->and($offer['priceSpecification']['priceType'])->toBe('https://schema.org/StrikethroughPrice');
});

test('out of stock products publish OutOfStock availability', function () {
    $this->product->forceFill(['stock' => 0])->save();

    $offer = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk())['offers'];

    expect($offer['availability'])->toBe('https://schema.org/OutOfStock');
});

test('product schema uses the full description, weight, category path and ingredients', function () {
    $product = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());

    expect(mb_strlen($product['description']))->toBeGreaterThan(300)
        ->and($product['weight'])->toBe(['@type' => 'QuantitativeValue', 'value' => 0.5, 'unitCode' => 'KGM'])
        ->and($product['category'])->toBe('Halal Food > Dates')
        ->and($product['sku'])->toBe((string) $this->product->id)
        ->and($product['brand']['name'])->toBe('Al-Barakah Mart')
        ->and($product)->not->toHaveKeys(['gtin', 'gtin13', 'mpn']);

    $properties = collect($product['additionalProperty'])->pluck('value', 'name');
    expect($properties['Ingredients'])->toBe('Medjool dates')
        ->and($properties['Halal status'])->toBe('Halal-certified');
});

test('breadcrumbs include every category ancestor', function () {
    $breadcrumb = collect(schemaNodes($this->get('/products/premium-medjool-dates-500g')->assertOk()))
        ->firstWhere('@type', 'BreadcrumbList');

    expect(collect($breadcrumb['itemListElement'])->pluck('name')->all())
        ->toBe(['Home', 'Halal Food', 'Dates', 'Premium Medjool Dates 500g']);
});

test('a valid halal certificate is published, an expired one is not', function () {
    HalalCertification::factory()->create([
        'certifiable_type' => $this->product->getMorphClass(),
        'certifiable_id' => $this->product->id,
        'certifying_body' => 'Mindanao Halal Authority',
        'number' => 'HC-2026-00042',
        'valid_until' => now()->addYear(),
    ]);

    $valid = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());
    $properties = collect($valid['additionalProperty'])->pluck('value', 'name');

    expect($valid['hasCertification']['issuedBy']['name'])->toBe('Mindanao Halal Authority')
        ->and($valid['hasCertification']['certificationIdentification'])->toBe('HC-2026-00042')
        ->and($properties['Halal certificate number'])->toBe('HC-2026-00042');

    HalalCertification::query()->update(['valid_until' => now()->subDay()]);

    $expired = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());

    expect($expired)->not->toHaveKey('hasCertification')
        ->and(collect($expired['additionalProperty'])->pluck('name')->all())->not->toContain('Halal certificate number');
});

test('products with variations become a ProductGroup with one offer per variant', function () {
    $this->product->forceFill(['option1_name' => 'Size', 'free_shipping' => true])->save();
    ProductVariation::factory()->create([
        'product_id' => $this->product->id,
        'option1_value' => '500g',
        'price' => null,
        'stock' => 4,
        'sku' => 'MJD-500',
        'sort_order' => 0,
    ]);
    ProductVariation::factory()->create([
        'product_id' => $this->product->id,
        'option1_value' => '1kg',
        'price' => 85000,
        'stock' => 0,
        'sku' => 'MJD-1000',
        'sort_order' => 1,
    ]);

    $group = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());
    $variants = collect($group['hasVariant'])->keyBy('sku');

    expect($group['@type'])->toBe('ProductGroup')
        ->and($group['@id'])->toBe('http://localhost:8000/products/premium-medjool-dates-500g#product')
        ->and($group['variesBy'])->toBe(['https://schema.org/size'])
        ->and($group)->not->toHaveKey('offers')
        ->and($variants)->toHaveCount(2)
        ->and($variants['MJD-500']['size'])->toBe('500g')
        ->and($variants['MJD-500']['offers']['price'])->toBe('450.00')
        ->and($variants['MJD-500']['offers']['availability'])->toBe('https://schema.org/InStock')
        ->and($variants['MJD-1000']['offers']['price'])->toBe('850.00')
        ->and($variants['MJD-1000']['offers']['availability'])->toBe('https://schema.org/OutOfStock')
        ->and($variants['MJD-1000']['offers']['shippingDetails']['shippingRate']['value'])->toBe('0.00');
});

test('a product without reviews has no aggregateRating or review nodes', function () {
    $product = productNode($this->get('/products/premium-medjool-dates-500g')->assertOk());

    expect($product)->not->toHaveKeys(['aggregateRating', 'review']);
});

test('ratings use real visible reviews, hide anonymous names and never emit seller replies', function () {
    $named = User::factory()->create(['name' => 'Aisha Macapodi']);
    $secret = User::factory()->create(['name' => 'Secret Reviewer']);

    Review::factory()->create([
        'product_id' => $this->product->id,
        'user_id' => $named->id,
        'rating' => 5,
        'body' => 'Fresh and soft.',
        'anonymous' => false,
        'hidden' => false,
        'seller_reply' => 'Thank you, we ship daily!',
    ]);
    Review::factory()->create([
        'product_id' => $this->product->id,
        'user_id' => $secret->id,
        'rating' => 4,
        'body' => 'Good value.',
        'anonymous' => true,
        'hidden' => false,
    ]);
    Review::factory()->create([
        'product_id' => $this->product->id,
        'rating' => 1,
        'body' => 'Hidden by moderation.',
        'anonymous' => false,
        'hidden' => true,
    ]);

    $response = $this->get('/products/premium-medjool-dates-500g')->assertOk();
    $product = productNode($response);
    $authors = collect($product['review'])->pluck('author.name')->all();

    expect($product['aggregateRating']['reviewCount'])->toBe(2)
        ->and($product['aggregateRating']['ratingValue'])->toBe('4.5')
        ->and($product['review'])->toHaveCount(2)
        ->and($authors)->toContain('Aisha Macapodi', 'Anonymous')
        ->and($authors)->not->toContain('Secret Reviewer');

    $json = json_encode(schemaNodes($response), JSON_THROW_ON_ERROR);
    expect($json)->not->toContain('Secret Reviewer')
        ->and($json)->not->toContain('Thank you, we ship daily!')
        ->and($json)->not->toContain('Hidden by moderation.');
});

test('private shop registration fields never appear in the head or JSON-LD', function () {
    $this->shop->forceFill([
        'address_line' => '77 Confidential Street',
        'postal_code' => 'ZZ-POSTAL-4417',
        'business_permit_url' => 'permits/confidential-permit.pdf',
        'payout_account_name' => 'Confidential Payee',
        'payout_account_number' => '9876543210123',
    ])->save();

    foreach (['/shops/al-barakah-mart', '/products/premium-medjool-dates-500g', '/sellers', '/'] as $path) {
        $html = (string) $this->get($path)->assertOk()->getContent();
        preg_match('#<head>.*?</head>#s', $html, $head);
        $head = $head[0] ?? '';

        expect($head)->not->toBe('');
        foreach (['77 Confidential Street', 'ZZ-POSTAL-4417', 'confidential-permit', 'Confidential Payee', '9876543210123'] as $secret) {
            expect($head)->not->toContain($secret);
        }
    }
});

test('shop Store node lists real catalog categories and only city level location', function () {
    $store = collect(schemaNodes($this->get('/shops/al-barakah-mart')->assertOk()))->firstWhere('@type', 'Store');

    expect($store['areaServed']['name'])->toBe('Philippines')
        ->and($store['address'])->toHaveKey('addressLocality', 'Cotabato City')
        ->and($store['address'])->not->toHaveKeys(['streetAddress', 'postalCode'])
        ->and(collect($store['hasOfferCatalog']['itemListElement'])->pluck('name')->all())->toBe(['Dates']);
});

test('category and sellers listings reference the same @ids as the detail pages', function () {
    $list = collect(schemaNodes($this->get('/categories/dates')->assertOk()))->firstWhere('@type', 'ItemList');
    $firstItem = $list['itemListElement'][0]['item'];

    expect($firstItem['@type'])->toBe('Product')
        ->and($firstItem['@id'])->toBe('http://localhost:8000/products/premium-medjool-dates-500g#product')
        ->and($firstItem['url'])->toBe('http://localhost:8000/products/premium-medjool-dates-500g');

    $sellers = collect(schemaNodes($this->get('/sellers')->assertOk()))->firstWhere('@type', 'ItemList');
    $shopItem = collect($sellers['itemListElement'])->pluck('item')->firstWhere('name', 'Al-Barakah Mart');

    expect($shopItem['@type'])->toBe('Store')
        ->and($shopItem['@id'])->toBe('http://localhost:8000/shops/al-barakah-mart#store');
});
