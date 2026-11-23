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
 * T0.7 — Confirm Inertia SSR returns crawlable body content.
 *
 * AC: a crawler UA request to home, a category, a product and a shop
 *     gets the page's key facts in the initial HTML response — either
 *     inside the Inertia page-data payload (always present) or as actual
 *     server-rendered body markup (when the SSR process is running).
 *
 * The first four tests assert the _page data_ is present regardless of
 * whether SSR is running: this is what search engines see once the SSR
 * node process is wired up (compose.yaml `ssr` service, CI `build:ssr`).
 *
 * The last test is an environment smoke check: it passes when the SSR
 * node process is reachable at the configured URL (config inertia.ssr.url)
 * and returns rendered body markup, and is skipped otherwise.
 */
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

beforeEach(function () {
    $this->shop = Shop::factory()->create([
        'user_id' => User::factory()->create()->id,
        'name' => 'Al-Noor Fresh',
        'slug' => 'al-noor-fresh',
        'status' => ShopStatus::Approved,
        'suspended' => false,
    ]);
    $this->category = Category::factory()->create([
        'name' => 'Halal Meat',
        'slug' => 'halal-meat',
        'parent_id' => null,
    ]);
    $this->product = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
        'name' => 'Grass-Fed Beef 500g',
        'slug' => 'grass-fed-beef-500g',
        'description' => 'Premium grass-fed halal beef from certified farms.',
        'published' => true,
        'stock' => 20,
        'price' => 55000,
        'halal_status' => HalalStatus::Certified,
    ]);
});

test('home page data payload contains site name and description for Googlebot', function () {
    $response = $this->withHeader('User-Agent', GOOGLEBOT_UA)->get('/');

    $response->assertOk();

    // Page payload is always present — SSR renders it into real HTML markup.
    $content = $response->getContent();
    expect($content)
        ->toContain('HalalBenta')
        ->toContain('verified halal');
});

test('category page data payload contains category name for Googlebot', function () {
    $response = $this->withHeader('User-Agent', GOOGLEBOT_UA)->get('/categories/halal-meat');

    $response->assertOk();

    $content = $response->getContent();
    expect($content)->toContain('Halal Meat');
});

test('product page data payload contains product name and price for Googlebot', function () {
    $response = $this->withHeader('User-Agent', GOOGLEBOT_UA)->get('/products/grass-fed-beef-500g');

    $response->assertOk();

    $content = $response->getContent();
    expect($content)
        ->toContain('Grass-Fed Beef 500g')
        // Price is always in the SEO JSON-LD and Inertia props.
        ->toContain('"price"');
});

test('shop page data payload contains shop name for Googlebot', function () {
    $response = $this->withHeader('User-Agent', GOOGLEBOT_UA)->get('/shops/al-noor-fresh');

    $response->assertOk();

    $content = $response->getContent();
    expect($content)->toContain('Al-Noor Fresh');
});

test('SSR process returns rendered body markup when running', function () {
    $ssrUrl = mb_rtrim((string) config('inertia.ssr.url', 'http://127.0.0.1:13714'), '/');

    // Skip when the SSR node process is not running (CI without SSR, local dev).
    try {
        $health = Illuminate\Support\Facades\Http::timeout(2)->get("{$ssrUrl}/health");
        if (! $health->successful()) {
            $this->markTestSkipped('Inertia SSR server is not running — skipping environment smoke check.');
        }
    } catch (Exception) {
        $this->markTestSkipped('Inertia SSR server is not running — skipping environment smoke check.');
    }

    // With SSR running, body markup is fully rendered server-side.
    foreach ([
        '/' => 'HalalBenta',
        '/categories/halal-meat' => 'Halal Meat',
        '/products/grass-fed-beef-500g' => 'Grass-Fed Beef',
        '/shops/al-noor-fresh' => 'Al-Noor Fresh',
    ] as $path => $expectedText) {
        $html = $this->withHeader('User-Agent', GOOGLEBOT_UA)->get($path)->assertOk()->getContent();

        // The rendered <body> must contain the text as visible markup, not only
        // inside a data attribute or JSON blob — confirming SSR is wired up.
        // React SSR wraps text in HTML comment nodes (<!-- -->text<!-- -->),
        // so we confirm the app div has data-server-rendered="true" and that the
        // text appears somewhere in the rendered body HTML.
        $bodyHtml = mb_substr($html, (int) mb_strpos($html, '<body'));

        expect($bodyHtml)->toContain('data-server-rendered="true"');

        // Strip the data-page JSON blob so we match only rendered markup.
        $bodyWithoutPayload = preg_replace(
            '#<script data-page="app" type="application/json">.*?</script>#s',
            '',
            $bodyHtml,
        ) ?? $bodyHtml;

        expect($bodyWithoutPayload)->toContain($expectedText);
    }
})->group('ssr');
