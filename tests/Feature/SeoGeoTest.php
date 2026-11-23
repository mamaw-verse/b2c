<?php

declare(strict_types=1);

use App\Actions\Seo\InvalidateSitemapCache;
use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

/**
 * GEO layer tests (docs/planning/14 T4.1-T4.3).
 *
 * @return array<string, mixed>
 */
function geoJsonLd(Illuminate\Testing\TestResponse $response): array
{
    preg_match_all('#<script type="application/ld\+json">\s*(.*?)\s*</script>#s', $response->getContent(), $matches);

    expect($matches[1])->toHaveCount(1);

    return json_decode($matches[1][0], true, flags: JSON_THROW_ON_ERROR);
}

/**
 * @param  array<string, mixed>  $document
 * @return array<string, mixed>|null
 */
function geoNode(array $document, string $type): ?array
{
    foreach ($document['@graph'] ?? [] as $node) {
        if (($node['@type'] ?? null) === $type) {
            return $node;
        }
    }

    return null;
}

/** Canonical origin the app emits in absolute URLs (config('app.url') without trailing slash). */
function geoOrigin(): string
{
    return mb_rtrim((string) config('app.url'), '/');
}

beforeEach(function () {
    Cache::flush();
    $this->app['env'] = 'production';
    config(['seo.force_noindex' => false]);
});

// ---- T4.2 llms.txt -------------------------------------------------------

test('llms.txt is served as plain text with the site summary and key facts', function () {
    $response = $this->get('/llms.txt')->assertOk();

    expect($response->headers->get('Content-Type'))->toContain('text/plain');

    $body = $response->getContent();
    expect($body)->toStartWith('# HalalBenta')
        ->and($body)->toContain('> '.config('seo.description'))
        ->and($body)->toContain('## Key facts')
        ->and($body)->toContain(geoOrigin().'/why-choose-us')
        ->and($body)->toContain(geoOrigin().'/sellers')
        ->and($body)->toContain(geoOrigin().'/seller/terms')
        ->and($body)->toContain(geoOrigin().'/sitemap.xml');
});

test('llms.txt is not served outside production or when noindex is forced', function () {
    $this->app['env'] = 'testing';
    $this->get('/llms.txt')->assertNotFound();

    $this->app['env'] = 'production';
    config(['seo.force_noindex' => true]);
    $this->get('/llms.txt')->assertNotFound();
});

test('llms.txt lists only top-level categories as public absolute links', function () {
    $parent = Category::factory()->create(['name' => 'Halal Food', 'slug' => 'halal-food', 'parent_id' => null, 'sort_order' => 1]);
    Category::factory()->create(['name' => 'Fresh Dates', 'slug' => 'fresh-dates', 'parent_id' => $parent->id, 'sort_order' => 1]);

    $body = $this->get('/llms.txt')->assertOk()->getContent();

    expect($body)->toContain(geoOrigin().'/categories/halal-food')
        ->and($body)->not->toContain('fresh-dates');
});

test('llms.txt lists a content page only when it is enabled', function () {
    config(['marketplace.pages.returns.enabled' => true, 'marketplace.pages.about.enabled' => false]);

    $body = $this->get('/llms.txt')->assertOk()->getContent();

    expect($body)->toContain(geoOrigin().'/pages/returns')
        ->and($body)->not->toContain('/pages/about')
        ->and($body)->not->toContain('/pages/help');
});

test('every URL in llms.txt is a public, resolvable route', function () {
    Category::factory()->create(['slug' => 'halal-food', 'parent_id' => null]);
    config(['marketplace.pages.returns.enabled' => true]);

    $body = $this->get('/llms.txt')->assertOk()->getContent();
    preg_match_all('#\]\(('.preg_quote(geoOrigin(), '#').'[^)]*)\)#', $body, $matches);

    expect($matches[1])->not->toBeEmpty();

    foreach (array_unique($matches[1]) as $url) {
        $path = parse_url($url, PHP_URL_PATH) ?: '/';
        $this->get($path)->assertOk();
    }
});

test('llms.txt is rebuilt after the sitemap cache is invalidated', function () {
    $first = $this->get('/llms.txt')->assertOk()->getContent();
    expect($first)->not->toContain('halal-snacks');

    Category::factory()->create(['name' => 'Halal Snacks', 'slug' => 'halal-snacks', 'parent_id' => null]);
    resolve(InvalidateSitemapCache::class)->handle();

    $this->get('/llms.txt')->assertOk()->assertSee('halal-snacks', false);
});

test('no static llms.txt shadows the dynamic route', function () {
    expect(file_exists(public_path('llms.txt')))->toBeFalse()
        ->and(file_exists(public_path('llms-full.txt')))->toBeFalse();
});

// ---- T4.3 trust and policy facts ------------------------------------------

test('return window in llms.txt, Organization and meta description all follow config', function () {
    config(['marketplace.return_window_days' => 14, 'marketplace.pages.returns.enabled' => true]);

    $this->get('/llms.txt')->assertOk()->assertSee('within 14 days', false);

    $home = geoJsonLd($this->get('/')->assertOk());
    $policy = geoNode($home, 'Organization')['hasMerchantReturnPolicy'] ?? null;

    expect($policy)->not->toBeNull()
        ->and($policy['merchantReturnDays'])->toBe(14)
        ->and($policy['applicableCountry'])->toBe('PH')
        ->and($policy['returnPolicyCategory'])->toBe('https://schema.org/MerchantReturnFiniteReturnWindow');

    $this->get('/pages/returns')->assertOk()->assertSee('Request returns within 14 days', false);
});

test('a zero return window is published as returns not permitted everywhere', function () {
    config(['marketplace.return_window_days' => 0]);

    $home = geoJsonLd($this->get('/')->assertOk());
    $policy = geoNode($home, 'Organization')['hasMerchantReturnPolicy'];

    expect($policy['returnPolicyCategory'])->toBe('https://schema.org/MerchantReturnNotPermitted')
        ->and($policy)->not->toHaveKey('merchantReturnDays');

    $this->get('/llms.txt')->assertOk()->assertSee('Returns are not accepted', false);
});

test('llms.txt states escrow-protected checkout, matching the sitewide description', function () {
    $this->get('/llms.txt')->assertOk()->assertSee('Checkout: Escrow-protected checkout', false);
});

test('halal verification is claimed in llms.txt only when the business enables it', function () {
    $this->get('/llms.txt')->assertOk()->assertDontSee('Halal verification:', false);

    Cache::flush();
    config(['marketplace.claims.halal_verification' => true]);

    $this->get('/llms.txt')->assertOk()->assertSee('Halal verification:', false);
});

test('configured couriers and payment methods appear in llms.txt, and are omitted when unset', function () {
    $this->get('/llms.txt')->assertOk()->assertDontSee('Couriers:', false)->assertDontSee('Payment methods:', false);

    Cache::flush();
    config(['marketplace.couriers' => ['J&T Express', 'LBC'], 'marketplace.payments' => ['GCash', 'COD']]);

    $this->get('/llms.txt')->assertOk()
        ->assertSee('Couriers: J&T Express, LBC.', false)
        ->assertSee('Payment methods: GCash, COD.', false);
});

test('llms.txt never exposes private shop data', function () {
    $user = User::factory()->create();
    Shop::factory()->create([
        'user_id' => $user->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
        'payout_account_number' => '9988776655',
        'address_line' => '12 Secret Street',
    ]);

    $body = $this->get('/llms.txt')->assertOk()->getContent();

    expect($body)->not->toContain('9988776655')
        ->and($body)->not->toContain('Secret Street');
});

// ---- T4.1 AI crawler policy ----------------------------------------------

test('robots.txt keeps search and answer bots allowed by default and still lists the sitemap', function () {
    $robots = $this->get('/robots.txt')->assertOk()->getContent();
    $groups = preg_split("/\n\n+/", mb_trim($robots));

    foreach (config('seo.ai_crawlers.search') as $agent) {
        $group = collect($groups)->first(fn (string $g) => str_contains($g, "User-agent: {$agent}\n"));
        expect($group)->not->toBeNull()->toContain('Allow: /');
    }

    expect($robots)->toContain('Sitemap: '.geoOrigin().'/sitemap.xml');
});

test('disabling AI crawler groups leaves only the wildcard group', function () {
    config(['seo.ai_crawlers.emit_groups' => false]);

    $robots = $this->get('/robots.txt')->assertOk()->getContent();

    expect($robots)->not->toContain('User-agent: GPTBot')
        ->and($robots)->not->toContain('User-agent: OAI-SearchBot')
        ->and($robots)->toContain('User-agent: *');
});
