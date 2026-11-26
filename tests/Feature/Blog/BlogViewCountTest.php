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
