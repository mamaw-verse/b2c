<?php

declare(strict_types=1);

use App\Enums\HalalStatus;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Review;
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
    expect($response->getContent())->toMatch('/<title[^>]*>HalalBenta – Verified Halal Marketplace in the Philippines<\/title>/');
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
    $response->assertSee('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">', false);
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

test('empty category omits the ItemList node instead of emitting one without elements', function () {
    $empty = Category::factory()->create(['name' => 'Empty Shelf', 'slug' => 'empty-shelf']);

    $response = $this->get('/categories/'.$empty->slug);

    $response->assertOk();
    $response->assertSee('"@type":"CollectionPage"', false);
    $response->assertDontSee('"@type":"ItemList"', false);
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
    $response->assertSee('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">', false);
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
    expect($response->headers->get('Cache-Control'))->not->toContain('immutable');

    $versionedResponse = $this->get("/social/product/{$this->product->slug}.jpg?v=12345");
    $versionedResponse->assertOk();
    expect($versionedResponse->headers->get('Cache-Control'))->toContain('immutable');
});

test('saving a published product dispatches pre-warm social image job', function () {
    Illuminate\Support\Facades\Queue::fake();

    $product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'published' => true,
        'hidden' => false,
    ]);

    Illuminate\Support\Facades\Queue::assertPushed(App\Jobs\PreWarmSocialImageJob::class, function ($job) use ($product) {
        return $job->type === 'product' && $job->slug === $product->slug;
    });
});

test('GenerateSocialImage handles extreme titles, non-latin characters and emoji safely', function () {
    $generator = resolve(App\Actions\Seo\GenerateSocialImage::class);

    $longProduct = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'VeryLongProductTitleWithoutAnySpacesThatWouldNormallyBreakWordWrapping 🌟 Special Edition Halal Premium',
        'published' => true,
        'halal_status' => HalalStatus::Certified,
        'price' => 19999,
    ]);

    $path = $generator->handle('product', $longProduct->slug, 'test-version');
    expect(file_exists($path))->toBeTrue()
        ->and(filesize($path))->toBeGreaterThan(0);
});

/**
 * Extract and decode the page's JSON-LD document.
 *
 * @return array<string, mixed>
 */
function jsonLdFrom(Illuminate\Testing\TestResponse $response): array
{
    preg_match_all('#<script type="application/ld\+json">\s*(.*?)\s*</script>#s', $response->getContent(), $matches);

    expect($matches[1])->toHaveCount(1);

    $decoded = json_decode($matches[1][0], true, flags: JSON_THROW_ON_ERROR);
    expect($decoded)->toBeArray();

    return $decoded;
}

/** @param  array<mixed>  $value */
function collectRefs(array $value, array &$refs, array &$ids): void
{
    foreach ($value as $key => $item) {
        if (! is_array($item)) {
            expect($item === '')->toBeFalse();

            continue;
        }
        expect($item === [])->toBeFalse();

        if (isset($item['@id']) && count($item) === 1) {
            $refs[] = $item['@id'];
        } elseif (isset($item['@id'])) {
            $ids[] = $item['@id'];
        }

        collectRefs($item, $refs, $ids);
    }
}

test('every public page emits one valid, linked JSON-LD @graph', function (string $path) {
    $document = jsonLdFrom($this->get($path)->assertOk());

    expect($document['@context'])->toBe('https://schema.org')
        ->and($document['@graph'])->toBeArray()->not->toBeEmpty();

    $topLevelIds = [];
    foreach ($document['@graph'] as $node) {
        expect($node)->toHaveKey('@type');
        if (isset($node['@id'])) {
            $topLevelIds[] = $node['@id'];
        }
    }

    expect($topLevelIds)->toBe(array_values(array_unique($topLevelIds)));

    $refs = [];
    $ids = [];
    collectRefs($document['@graph'], $refs, $ids);

    $origin = 'http://localhost:8000';
    $sitewide = ["{$origin}/#organization", "{$origin}/#website"];

    foreach (array_unique($refs) as $ref) {
        expect([...$topLevelIds, ...$ids, ...$sitewide])->toContain($ref);
    }
})->with([
    'home' => '/',
    'product' => '/products/premium-medjool-dates-500g',
    'category' => '/categories/halal-food',
    'shop' => '/shops/al-barakah-mart',
    'sellers' => '/sellers',
    'why choose us' => '/why-choose-us',
    'seller terms' => '/seller/terms',
]);

test('home page links Organization, WebSite and WebPage by stable @id', function () {
    $document = jsonLdFrom($this->get('/')->assertOk());
    $byType = collect($document['@graph'])->keyBy('@type');

    expect($byType['Organization']['@id'])->toBe('http://localhost:8000/#organization')
        ->and($byType['Organization']['logo']['url'])->toBe('http://localhost:8000/brand/halalbenta-icon-512.png')
        ->and($byType['WebSite']['@id'])->toBe('http://localhost:8000/#website')
        ->and($byType['WebSite']['publisher'])->toBe(['@id' => 'http://localhost:8000/#organization'])
        ->and($byType['WebSite']['potentialAction']['target']['@type'])->toBe('EntryPoint')
        ->and($byType['WebPage']['isPartOf'])->toBe(['@id' => 'http://localhost:8000/#website']);
});

test('product JSON-LD links Product, seller store and breadcrumb', function () {
    $document = jsonLdFrom($this->get('/products/premium-medjool-dates-500g')->assertOk());
    $byType = collect($document['@graph'])->keyBy('@type');

    expect($byType['Product']['@id'])->toBe('http://localhost:8000/products/premium-medjool-dates-500g#product')
        ->and($byType['Product']['offers']['seller']['@id'])->toBe('http://localhost:8000/shops/al-barakah-mart#store')
        ->and($byType['WebPage']['mainEntity'])->toBe(['@id' => $byType['Product']['@id']])
        ->and($byType['WebPage']['breadcrumb'])->toBe(['@id' => $byType['BreadcrumbList']['@id']]);
});

test('hostile product names cannot break out of the JSON-LD script tag', function () {
    $hostile = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => '</script><script>alert(1)</script>',
        'slug' => 'hostile-product',
        'published' => true,
        'stock' => 5,
    ]);

    $response = $this->get("/products/{$hostile->slug}")->assertOk();

    expect($response->getContent())->not->toContain('<script>alert(1)</script>');

    $document = jsonLdFrom($response);
    $product = collect($document['@graph'])->firstWhere('@type', 'Product');
    expect($product['name'])->toBe('</script><script>alert(1)</script>');
});

test('shop with followers but no reviews has no aggregateRating', function () {
    $this->shop->forceFill(['followers_count' => 250, 'rating' => 4.8])->save();

    $document = jsonLdFrom($this->get('/shops/al-barakah-mart')->assertOk());
    $store = collect($document['@graph'])->firstWhere('@type', 'Store');

    expect($store)->not->toHaveKey('aggregateRating');
});

test('shop aggregateRating uses real visible review count and average, never followers', function () {
    $this->shop->forceFill(['followers_count' => 250])->save();

    Review::factory()->create(['product_id' => $this->product->id, 'rating' => 5, 'hidden' => false]);
    Review::factory()->create(['product_id' => $this->product->id, 'rating' => 4, 'hidden' => false]);
    Review::factory()->create(['product_id' => $this->product->id, 'rating' => 1, 'hidden' => true]);

    $document = jsonLdFrom($this->get('/shops/al-barakah-mart')->assertOk());
    $store = collect($document['@graph'])->firstWhere('@type', 'Store');

    expect($store['aggregateRating']['reviewCount'])->toBe(2)
        ->and($store['aggregateRating']['ratingValue'])->toBe('4.5');
});

test('the canonical logo and default social image are real, square-enough files', function () {
    $logo = public_path(mb_ltrim((string) config('seo.logo_path'), '/'));
    expect(file_exists($logo))->toBeTrue();

    [$width, $height] = getimagesize($logo);
    expect($width)->toBe($height)->and($width)->toBeGreaterThanOrEqual(112);
});

test('no builder references the removed /images/brand/logo.png schema logo', function () {
    $matches = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(app_path())) as $file) {
        if ($file->isFile() && str_ends_with($file->getFilename(), '.php')
            && str_contains((string) file_get_contents($file->getPathname()), 'images/brand/logo.png')) {
            $matches[] = $file->getPathname();
        }
    }

    expect($matches)->toBe([]);
});

test('no static robots.txt or sitemap files shadow the dynamic routes', function () {
    expect(file_exists(public_path('robots.txt')))->toBeFalse()
        ->and(glob(public_path('sitemap*.xml')))->toBe([]);
});

test('robots.txt, meta robots and X-Robots-Tag agree on every private path pattern', function () {
    $this->app['env'] = 'production';

    $robots = $this->get('/robots.txt')->assertOk()->getContent();

    foreach (config('seo.private_path_patterns') as $pattern) {
        $sample = mb_rtrim($pattern, '*');
        $expectedRule = 'Disallow: /'.mb_ltrim($sample, '/');

        expect($robots)->toContain($expectedRule);
        expect(App\Support\SeoData::isPrivatePath($sample))->toBeTrue();
        expect(App\Support\SeoData::defaultRobots($sample))->toBe('noindex, nofollow');
    }

    expect($robots)->toContain('Allow: /seller/terms')
        ->and(App\Support\SeoData::isPrivatePath('seller/terms'))->toBeFalse()
        ->and($robots)->toContain('Sitemap: http://localhost:8000/sitemap.xml');
});

test('robots.txt blocks everything outside production and when force_noindex is on', function () {
    $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /', false)->assertDontSee('Sitemap:', false);

    $this->app['env'] = 'production';
    config(['seo.force_noindex' => true]);
    $this->get('/robots.txt')->assertOk()->assertDontSee('Sitemap:', false);
});

test('each named AI crawler repeats the private path disallows', function () {
    $this->app['env'] = 'production';
    $robots = $this->get('/robots.txt')->assertOk()->getContent();

    $groups = preg_split("/\n\n+/", mb_trim($robots));
    $agents = [...config('seo.ai_crawlers.search'), ...config('seo.ai_crawlers.training')];

    foreach ($agents as $agent) {
        $group = collect($groups)->first(fn (string $g) => str_contains($g, "User-agent: {$agent}\n"));
        expect($group)->not->toBeNull();

        foreach (['/cart', '/checkout', '/account', '/admin', '/api'] as $path) {
            expect($group)->toContain("Disallow: {$path}");
        }
    }
});

test('blocking AI training crawlers disallows everything for them only', function () {
    $this->app['env'] = 'production';
    config(['seo.ai_crawlers.block_training' => true]);

    $robots = $this->get('/robots.txt')->assertOk()->getContent();
    $groups = preg_split("/\n\n+/", mb_trim($robots));
    $gptGroup = collect($groups)->first(fn (string $g) => str_contains($g, "User-agent: GPTBot\n"));
    $searchGroup = collect($groups)->first(fn (string $g) => str_contains($g, "User-agent: OAI-SearchBot\n"));

    expect($gptGroup)->toContain('Disallow: /')->not->toContain('Allow: /')
        ->and($searchGroup)->toContain('Allow: /');
});

test('sitemap index uses real lastmod values and omits lastmod for static pages', function () {
    $first = $this->get('/sitemap.xml')->assertOk()->getContent();
    $second = $this->get('/sitemap.xml')->assertOk()->getContent();

    expect($first)->toBe($second);

    $xml = simplexml_load_string($first);
    $entries = collect($xml->sitemap)->keyBy(fn ($s) => (string) $s->loc);

    expect(isset($entries['http://localhost:8000/sitemap-pages.xml']->lastmod))->toBeFalse()
        ->and(isset($entries['http://localhost:8000/sitemap-products-1.xml']->lastmod))->toBeTrue()
        ->and((string) $entries['http://localhost:8000/sitemap-products-1.xml']->lastmod)
        ->toBe($this->product->fresh()->updated_at->toIso8601String());
});
