<?php

declare(strict_types=1);

use App\Actions\Seo\AuditSeoPages;
use App\Enums\ShopStatus;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

/*
 * Weekly SEO audit (docs/planning/14 T5.4). Http is faked and routed into the application's own
 * test kernel, so the audit sees exactly what a crawler would, without a network.
 */
beforeEach(function () {
    $shop = Shop::factory()->create([
        'user_id' => User::factory()->create()->id,
        'status' => ShopStatus::Approved,
        'suspended' => false,
        'slug' => 'al-barakah-mart',
    ]);
    $category = Category::factory()->create(['slug' => 'halal-food']);

    Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'name' => 'Premium Medjool Dates 500g',
        'slug' => 'premium-medjool-dates-500g',
        'published' => true,
        'price' => 45000,
        'stock' => 25,
    ]);
});

/**
 * Route every audited request into the app, except static images (served by the web server in
 * production, so they have no Laravel route): those answer 200 unless the path starts with $brokenPrefix.
 */
function fakeSite(object $test, ?string $brokenPrefix = null): void
{
    Http::fake(function (Request $request) use ($test, $brokenPrefix) {
        $path = (string) (parse_url($request->url(), PHP_URL_PATH) ?: '/');
        $query = parse_url($request->url(), PHP_URL_QUERY);

        if ($brokenPrefix !== null && str_starts_with($path, $brokenPrefix)) {
            return Http::response('', 404);
        }

        if (preg_match('#\.(png|jpe?g|webp|svg|gif)$#i', $path) === 1) {
            return Http::response('', 200);
        }

        $response = $test->get($path.(is_string($query) && $query !== '' ? '?'.$query : ''));

        return Http::response((string) $response->getContent(), $response->getStatusCode());
    });
}

test('a healthy site passes the audit with no failures', function () {
    fakeSite($this);

    $report = resolve(AuditSeoPages::class)->handle('http://localhost:8000', 10);

    expect($report['failures'])->toBe([])
        ->and($report['checked'])->toBeGreaterThanOrEqual(7);
});

test('the audit samples the product page and checks its images', function () {
    fakeSite($this);

    resolve(AuditSeoPages::class)->handle('http://localhost:8000', 10);

    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/products/premium-medjool-dates-500g');
    Http::assertSent(fn (Request $request): bool => str_contains($request->url(), '/social/product/premium-medjool-dates-500g.jpg'));
    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/sitemap.xml');
    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/robots.txt');
});

test('a broken social image is reported as a failure', function () {
    fakeSite($this, brokenPrefix: '/social/product/');

    $report = resolve(AuditSeoPages::class)->handle('http://localhost:8000', 10);

    $problems = array_column($report['failures'], 'problem');

    expect(collect($problems)->contains(fn (string $problem): bool => str_starts_with($problem, 'Image does not answer 200')))->toBeTrue();
});

test('a page that does not answer 200 is reported', function () {
    fakeSite($this, brokenPrefix: '/sellers');

    $report = resolve(AuditSeoPages::class)->handle('http://localhost:8000', 0);

    expect($report['failures'])->toContain(['url' => 'http://localhost:8000/sellers', 'problem' => 'HTTP 404, expected 200.']);
});

test('an unreachable site is reported instead of throwing', function () {
    Http::fake(fn () => throw new ConnectionException('offline'));

    $report = resolve(AuditSeoPages::class)->handle('http://localhost:8000', 0);

    expect($report['failures'])->not->toBeEmpty()
        ->and($report['failures'][0]['problem'])->toBe('Request failed (timeout or connection error).');
});

test('seo:audit exits successfully on a healthy site', function () {
    fakeSite($this);

    $this->artisan('seo:audit', ['--base-url' => 'http://localhost:8000', '--sample' => 5])
        ->assertSuccessful();
});

test('seo:audit exits non-zero and logs an error when something regressed', function () {
    Log::spy();
    fakeSite($this, brokenPrefix: '/sellers');

    $this->artisan('seo:audit', ['--base-url' => 'http://localhost:8000', '--sample' => 0])
        ->assertFailed();

    Log::shouldHaveReceived('error')->withArgs(fn (string $message): bool => $message === 'SEO audit found regressions.')->once();
});

test('seo:audit is scheduled weekly in production only', function () {
    Artisan::call('list'); // boots the console kernel, which registers routes/console.php schedules

    $event = collect(resolve(Schedule::class)->events())
        ->first(fn ($event): bool => str_contains((string) $event->command, 'seo:audit'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('0 5 * * 1')
        ->and($event->environments)->toBe(['production'])
        ->and($event->withoutOverlapping)->toBeTrue();
});

test('the audit samples the blog index, latest posts, an author page and the blog sitemap when the blog is on', function () {
    config(['blog.enabled' => true]);
    $post = BlogPost::factory()->published()->create();
    fakeSite($this);

    $report = resolve(AuditSeoPages::class)->handle('http://localhost:8000', 10);

    expect($report['failures'])->toBe([]);

    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/blog');
    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/blog/'.$post->slug);
    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/blog/author/'.$post->author->slug);
    Http::assertSent(fn (Request $request): bool => $request->url() === 'http://localhost:8000/sitemap-blog.xml');
});

test('the audit skips the blog while it is switched off', function () {
    BlogPost::factory()->published()->create();
    fakeSite($this);

    resolve(AuditSeoPages::class)->handle('http://localhost:8000', 10);

    Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), '/blog'));
});
