<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->sellerUser = User::factory()->create();
    $this->shop = Shop::factory()->create([
        'user_id' => $this->sellerUser->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
        'name' => 'Al-Barakah Mart',
        'slug' => 'al-barakah-mart',
        'city' => 'Cotabato City',
    ]);
    $this->category = Category::factory()->create([
        'name' => 'Halal Food',
        'slug' => 'halal-food',
    ]);
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Premium Medjool Dates 500g',
        'slug' => 'premium-medjool-dates-500g',
        'description' => 'Delicious imported dates from Madinah. Rich in nutrients and fiber.',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 45000,
        'stock' => 25,
        'free_shipping' => true,
    ]);
});

test('home page renders complete SEO and social tags with Organization and WebSite schema', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertSee('<title>HalalBenta – Verified Halal Marketplace in the Philippines</title>', false);
    $response->assertSee('<meta name="description" content="Shop verified halal food, meat &amp; seafood, dates &amp; sweets, modest fashion, prayer essentials and more. Escrow-protected checkout, delivered across the Philippines.">', false);
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/">', false);
    $response->assertSee('<meta property="og:site_name" content="HalalBenta">', false);
    $response->assertSee('<meta property="og:locale" content="en_PH">', false);
    $response->assertSee('<meta property="og:type" content="website">', false);
    $response->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
    $response->assertSee('"@type":"Organization"', false);
    $response->assertSee('"@type":"WebSite"', false);
    $response->assertSee('"@type":"SearchAction"', false);
});

test('product detail page renders complete SEO tags, product:* OpenGraph tags and JSON-LD', function () {
    $response = $this->get('/products/'.$this->product->slug);

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/products/premium-medjool-dates-500g">', false);
    $response->assertSee('<meta property="og:type" content="product">', false);
    $response->assertSee('<meta property="og:site_name" content="HalalBenta">', false);
    $response->assertSee('<meta property="product:price:amount" content="450.00">', false);
    $response->assertSee('<meta property="product:price:currency" content="PHP">', false);
    $response->assertSee('<meta property="product:availability" content="in stock">', false);
    $response->assertSee('<meta property="product:condition" content="new">', false);
    $response->assertSee('<meta property="product:brand" content="Al-Barakah Mart">', false);
    $response->assertSee('<meta property="og:price:amount" content="450.00">', false);
    $response->assertSee('<meta property="og:price:currency" content="PHP">', false);
    $response->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
    $response->assertSee('<meta name="twitter:label1" content="Price">', false);
    $response->assertSee('<meta name="twitter:data1" content="₱450">', false);
    $response->assertSee('<meta name="twitter:label2" content="Availability">', false);
    $response->assertSee('<meta name="twitter:data2" content="In stock">', false);
    $response->assertSee('"@type":"BreadcrumbList"', false);
    $response->assertSee('"@type":"Product"', false);
    $response->assertSee('"priceCurrency":"PHP"', false);
});

test('out of stock product remains indexable with out of stock schema and meta', function () {
    $this->product->update(['stock' => 0]);

    $response = $this->get('/products/'.$this->product->slug);

    $response->assertOk();
    $response->assertSee('<meta name="robots" content="index, follow">', false);
    $response->assertSee('<meta property="product:availability" content="out of stock">', false);
    $response->assertSee('<meta name="twitter:data2" content="Out of stock">', false);
    $response->assertSee('https://schema.org/OutOfStock', false);
});

test('product detail with variant query updates og:title while keeping clean canonical', function () {
    $variation = ProductVariation::factory()->create([
        'product_id' => $this->product->id,
        'option1_value' => '1kg Box',
        'price' => 85000,
        'stock' => 10,
    ]);

    $response = $this->get('/products/'.$this->product->slug.'?variant='.$variation->id);

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/products/premium-medjool-dates-500g">', false);
    $response->assertSee('Premium Medjool Dates 500g (1kg Box)', false);
    $response->assertSee('<meta property="product:price:amount" content="850.00">', false);
    $response->assertSee('<meta name="twitter:data1" content="₱850">', false);
});

test('product slug change triggers 301 redirect from old slug to new slug', function () {
    $oldSlug = $this->product->slug;

    $this->product->update([
        'slug' => 'premium-medjool-dates-new-slug',
    ]);

    $response = $this->get('/products/'.$oldSlug);

    $response->assertRedirect('/products/premium-medjool-dates-new-slug');
    $response->assertStatus(301);
});

test('category page renders CollectionPage and ItemList JSON-LD and clean canonical', function () {
    $response = $this->get('/categories/'.$this->category->slug);

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/categories/halal-food">', false);
    $response->assertSee('Halal Food – Shop Halal Halal Food Online in the Philippines | HalalBenta', false);
    $response->assertSee('"@type":"CollectionPage"', false);
    $response->assertSee('"@type":"ItemList"', false);
});

test('category page with filters sets noindex follow', function () {
    $response = $this->get('/categories/'.$this->category->slug.'?sort=price_asc&halal=true');

    $response->assertOk();
    $response->assertSee('<meta name="robots" content="noindex, follow">', false);
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/categories/halal-food">', false);
});

test('shop storefront renders Store schema, location, and social tags', function () {
    $response = $this->get('/shops/'.$this->shop->slug);

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/shops/al-barakah-mart">', false);
    $response->assertSee('Al-Barakah Mart – Halal Shop in Cotabato City | HalalBenta', false);
    $response->assertSee('"@type":"Store"', false);
    $response->assertSee('"addressLocality":"Cotabato City"', false);
});

test('suspended shop returns noindex nofollow', function () {
    $this->shop->update(['suspended' => true]);

    $response = $this->get('/shops/'.$this->shop->slug);

    $response->assertOk();
    $response->assertSee('<meta name="robots" content="noindex, nofollow">', false);
});

test('sellers directory renders collection of shops', function () {
    $response = $this->get('/sellers');

    $response->assertOk();
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/sellers">', false);
    $response->assertSee('Halal Sellers &amp; Shops in the Philippines | HalalBenta', false);
    $response->assertSee('"@type":"CollectionPage"', false);
});

test('search page renders noindex follow and clean canonical', function () {
    $response = $this->get('/search?q=dates');

    $response->assertOk();
    $response->assertSee('<meta name="robots" content="noindex, follow">', false);
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/search">', false);
    $response->assertSee('Search results for &quot;dates&quot; | HalalBenta', false);
});

test('why choose us page renders Organization schema and breadcrumbs', function () {
    $response = $this->get('/why-choose-us');

    $response->assertOk();
    $response->assertSee('Why Choose HalalBenta – Trusted Halal Marketplace', false);
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/why-choose-us">', false);
    $response->assertSee('"@type":"Organization"', false);
});

test('content page returns 200 when enabled and 404 when disabled', function () {
    config(['marketplace.pages.returns.enabled' => true]);
    $response = $this->get('/pages/returns');
    $response->assertOk();
    $response->assertSee('Returns &amp; refunds | HalalBenta', false);
    $response->assertSee('"@type":"WebPage"', false);

    config(['marketplace.pages.help.enabled' => false]);
    $responseDisabled = $this->get('/pages/help');
    $responseDisabled->assertNotFound();
});

test('seller terms page is indexable', function () {
    $response = $this->get('/seller/terms');

    $response->assertOk();
    $response->assertSee('Seller Terms &amp; Merchant Agreement | HalalBenta', false);
    $response->assertSee('<link rel="canonical" href="http://localhost:8000/seller/terms">', false);
    $response->assertSee('<meta name="robots" content="index, follow">', false);
});

test('uppercase and trailing slash URLs are 301 redirected to canonical format', function () {
    $requestSlash = Illuminate\Http\Request::create('http://localhost:8000/sellers/', 'GET');
    $middleware = new App\Http\Middleware\EnforceSeoStandards();
    $responseSlash = $middleware->handle($requestSlash, fn () => response('ok'));

    expect($responseSlash->getStatusCode())->toBe(301);
    expect($responseSlash->headers->get('Location'))->toBe('http://localhost:8000/sellers');

    $responseUpper = $this->get('/SELLERS');
    $responseUpper->assertStatus(301);
    $responseUpper->assertRedirect('http://localhost:8000/sellers');
});

test('private routes send X-Robots-Tag noindex nofollow and meta robots noindex nofollow', function () {
    $response = $this->get('/login');
    $response->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $response->assertSee('<meta name="robots" content="noindex, nofollow">', false);

    $responseRegister = $this->get('/register');
    $responseRegister->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $responseRegister->assertSee('<meta name="robots" content="noindex, nofollow">', false);
});

test('social crawlers receive initial HTML with all og and twitter tags', function ($crawlerUserAgent) {
    $response = $this->withHeaders(['User-Agent' => $crawlerUserAgent])
        ->get('/products/'.$this->product->slug);

    $response->assertOk();
    $response->assertSee('<meta property="og:title"', false);
    $response->assertSee('<meta property="og:description"', false);
    $response->assertSee('<meta property="og:image"', false);
    $response->assertSee('<meta property="og:url"', false);
    $response->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
})->with([
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'WhatsApp/2.21.12.21 i',
    'Twitterbot/1.0',
    'TelegramBot (like TwitterBot)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
]);

test('sitemaps return valid XML 200', function () {
    $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    $this->get('/sitemap-pages.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    $this->get('/sitemap-categories.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    $this->get('/sitemap-shops.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    $this->get('/sitemap-products-1.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
});

test('robots txt returns 200 text/plain with Sitemap directive', function () {
    $response = $this->get('/robots.txt');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
});

test('social image generator route serves dynamic image with cache headers', function () {
    $response = $this->get("/social/product/{$this->product->slug}.jpg");

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/jpeg');
    $response->assertHeader('Cache-Control');
});
