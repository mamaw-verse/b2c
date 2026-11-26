<?php

declare(strict_types=1);

use App\Actions\Blog\RecordBlogPostView;
use App\Models\BlogPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

const BROWSER_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

/**
 * A request as a given visitor session would send it.
 *
 * @param  array<string, string>  $server
 */
function viewRequest(string $sessionId = 'visitorone', string $method = 'GET', array $server = []): Request
{
    $request = Request::create('/blog/some-post', $method, server: ['HTTP_USER_AGENT' => BROWSER_UA, ...$server]);

    $session = app('session')->driver();
    // Laravel only accepts 40 alphanumeric characters; anything else is silently replaced by a random id.
    $session->setId(str_pad($sessionId, 40, 'x'));
    $request->setLaravelSession($session);

    return $request;
}

function recordView(BlogPost $post, Request $request): bool
{
    return app(RecordBlogPostView::class)->handle($post, $request);
}

test('a normal page load counts as one view', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 4]);

    expect(recordView($post, viewRequest()))->toBeTrue()
        ->and($post->fresh()->view_count)->toBe(5);
});

test('the same session is counted once per post per day', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);

    expect(recordView($post, viewRequest('visitorone')))->toBeTrue()
        ->and(recordView($post, viewRequest('visitorone')))->toBeFalse()
        ->and($post->fresh()->view_count)->toBe(1);
});

test('a different session or a different post counts separately', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);
    $other = BlogPost::factory()->published()->create(['view_count' => 0]);

    recordView($post, viewRequest('visitorone'));
    recordView($post, viewRequest('visitortwo'));
    recordView($other, viewRequest('visitorone'));

    expect($post->fresh()->view_count)->toBe(2)
        ->and($other->fresh()->view_count)->toBe(1);
});

test('the same session is counted again the next day', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);

    recordView($post, viewRequest());

    $this->travelTo(now()->addDay()->startOfDay()->addHour());

    expect(recordView($post, viewRequest()))->toBeTrue()
        ->and($post->fresh()->view_count)->toBe(2);
});

test('bots, empty user agents, HEAD and prefetch requests are ignored', function (array $server, string $method) {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);

    expect(recordView($post, viewRequest('visitorone', $method, $server)))->toBeFalse()
        ->and($post->fresh()->view_count)->toBe(0);
})->with([
    'Googlebot' => [['HTTP_USER_AGENT' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'], 'GET'],
    'GPTBot' => [['HTTP_USER_AGENT' => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1'], 'GET'],
    'Facebook link preview' => [['HTTP_USER_AGENT' => 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'], 'GET'],
    'curl' => [['HTTP_USER_AGENT' => 'curl/8.5.0'], 'GET'],
    'headless Chrome' => [['HTTP_USER_AGENT' => 'Mozilla/5.0 HeadlessChrome/126.0 Safari/537.36'], 'GET'],
    'no user agent' => [['HTTP_USER_AGENT' => ''], 'GET'],
    'HEAD request' => [[], 'HEAD'],
    'Sec-Purpose prefetch' => [['HTTP_SEC_PURPOSE' => 'prefetch;anonymous-client-ip'], 'GET'],
    'Purpose prefetch' => [['HTTP_PURPOSE' => 'prefetch'], 'GET'],
]);

test('counting touches neither updated_at nor the blog cache', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);
    $updatedAt = $post->fresh()->updated_at->toIso8601String();

    // Travel first: the cache entry has a 5-minute TTL and would expire during the jump.
    $this->travelTo(now()->addHours(2));
    Cache::put('blog:index:popular', ['cached'], 300);

    recordView($post, viewRequest());

    expect($post->fresh()->view_count)->toBe(1)
        ->and($post->fresh()->updated_at->toIso8601String())->toBe($updatedAt)
        ->and(Cache::get('blog:index:popular'))->toBe(['cached']);
});

test('the public post page records a view for a browser and not for a crawler', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);

    $this->withHeaders(['User-Agent' => BROWSER_UA])->get(route('blog.show', $post))->assertOk();
    expect($post->fresh()->view_count)->toBe(1);

    $other = BlogPost::factory()->published()->create(['view_count' => 0]);

    $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'])
        ->get(route('blog.show', $other))
        ->assertOk();
    expect($other->fresh()->view_count)->toBe(0);
});

// ---- B4.2: thirty-day popularity ----

use App\Actions\Blog\ListBlogIndex;
use App\Jobs\PruneBlogDailyViewsJob;
use Illuminate\Support\Facades\DB;

/** Seeds a per-day view row directly, as if the views had been recorded on that day. */
function dailyViews(BlogPost $post, int $daysAgo, int $views): void
{
    DB::table('blog_post_daily_views')->insert([
        'blog_post_id' => $post->id,
        'day' => now()->subDays($daysAgo)->toDateString(),
        'views' => $views,
    ]);
}

/** @return list<string> slugs on the popular rail, in order */
function popularSlugs(): array
{
    Cache::flush();

    return array_column(app(ListBlogIndex::class)->handle()['popular'], 'slug');
}

test('a counted view also writes one per-day row, and the same day adds to it', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 0]);

    recordView($post, viewRequest('visitorone'));
    recordView($post, viewRequest('visitortwo'));

    $rows = DB::table('blog_post_daily_views')->where('blog_post_id', $post->id)->get();

    expect($rows)->toHaveCount(1)
        ->and((int) $rows->first()->views)->toBe(2)
        ->and($rows->first()->day)->toBe(now()->toDateString())
        ->and($post->fresh()->view_count)->toBe(2);
});

test('an ignored request writes no per-day row', function () {
    $post = BlogPost::factory()->published()->create();

    recordView($post, viewRequest('visitorone', 'GET', ['HTTP_USER_AGENT' => 'curl/8.5.0']));

    expect(DB::table('blog_post_daily_views')->count())->toBe(0);
});

test('the popular rail ranks by the last 30 days, not by the all-time total', function () {
    $oldHit = BlogPost::factory()->published()->create(['slug' => 'old-hit', 'view_count' => 5000, 'published_at' => now()->subDays(200)]);
    $recent = BlogPost::factory()->published()->create(['slug' => 'recent', 'view_count' => 10, 'published_at' => now()->subDays(5)]);
    $middling = BlogPost::factory()->published()->create(['slug' => 'middling', 'view_count' => 3, 'published_at' => now()->subDays(6)]);

    dailyViews($oldHit, 45, 5000); // outside the window
    dailyViews($recent, 2, 8);
    dailyViews($recent, 29, 2); // the oldest day still inside a 30-day window
    dailyViews($middling, 1, 3);

    expect(popularSlugs())->toBe(['recent', 'middling', 'old-hit']);
});

test('day 30 ago is outside the window and posts without recent views follow newest first', function () {
    $edge = BlogPost::factory()->published()->create(['slug' => 'edge', 'published_at' => now()->subDays(90)]);
    $fresh = BlogPost::factory()->published()->create(['slug' => 'fresh', 'published_at' => now()->subDay()]);
    $stale = BlogPost::factory()->published()->create(['slug' => 'stale', 'published_at' => now()->subDays(60)]);

    dailyViews($edge, 30, 999);

    expect(popularSlugs())->toBe(['fresh', 'stale', 'edge']);
});

test('only live posts can be popular', function () {
    $draft = BlogPost::factory()->draft()->create(['slug' => 'draft-one']);
    $live = BlogPost::factory()->published()->create(['slug' => 'live-one']);

    dailyViews($draft, 0, 500);

    expect(popularSlugs())->toBe(['live-one']);
});

test('the prune job drops old per-day rows but keeps recent ones and all-time totals', function () {
    $post = BlogPost::factory()->published()->create(['view_count' => 77]);

    dailyViews($post, 120, 4);
    dailyViews($post, 91, 4);
    dailyViews($post, 89, 4);
    dailyViews($post, 0, 4);

    (new PruneBlogDailyViewsJob)->handle();

    expect(DB::table('blog_post_daily_views')->count())->toBe(2)
        ->and($post->fresh()->view_count)->toBe(77);
});

test('deleting a post removes its per-day rows', function () {
    $post = BlogPost::factory()->published()->create();
    dailyViews($post, 1, 3);

    $post->forceDelete();

    expect(DB::table('blog_post_daily_views')->count())->toBe(0);
});
