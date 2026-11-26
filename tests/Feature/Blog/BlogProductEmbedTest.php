<?php

declare(strict_types=1);

use App\Models\BlogPost;
use App\Models\Product;
use App\Support\Blog\BlogSegments;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

function embedMarker(string $slug): string
{
    return '<div data-blog-product="'.$slug.'"></div>'."\n";
}

// ---- B2.5: BlogSegments ----

test('a body without product markers is a single html segment', function () {
    expect(app(BlogSegments::class)->handle('<p>Hello</p>'))
        ->toBe([['type' => 'html', 'html' => '<p>Hello</p>']]);

    expect(app(BlogSegments::class)->handle(''))->toBe([]);
});

test('markers split the body into html and live product segments in reading order', function () {
    $first = Product::factory()->certified()->create();
    $second = Product::factory()->create();

    $html = '<p>Before</p>'.embedMarker($first->slug).'<p>Middle</p>'.embedMarker($second->slug).'<p>After</p>';

    $segments = app(BlogSegments::class)->handle($html);

    expect(array_column($segments, 'type'))->toBe(['html', 'product', 'html', 'product', 'html'])
        ->and($segments[0]['html'])->toBe('<p>Before</p>')
        ->and($segments[1]['product']['slug'])->toBe($first->slug)
        ->and($segments[1]['product']['halal_status'])->toBe('certified')
        ->and($segments[1]['product']['price'])->toBe($first->price)
        ->and($segments[3]['product']['slug'])->toBe($second->slug)
        ->and($segments[4]['html'])->toBe('<p>After</p>');
});

test('unavailable products are skipped silently', function () {
    $live = Product::factory()->create();
    $unpublished = Product::factory()->create(['published' => false]);
    $hidden = Product::factory()->create(['hidden' => true]);
    $notVisibleToBuyers = Product::factory()->create(['halal_status' => 'expired']);

    $html = '<p>Intro</p>'
        .embedMarker($unpublished->slug)
        .embedMarker($hidden->slug)
        .embedMarker($notVisibleToBuyers->slug)
        .embedMarker('no-such-product')
        .embedMarker($live->slug);

    $segments = app(BlogSegments::class)->handle($html);

    expect(array_column($segments, 'type'))->toBe(['html', 'product'])
        ->and($segments[1]['product']['slug'])->toBe($live->slug);
});

test('an embed that is the whole body and is unavailable leaves no segments', function () {
    expect(app(BlogSegments::class)->handle(embedMarker('gone')))->toBe([]);
});

test('every embedded product is loaded with one batched product query', function () {
    $products = Product::factory()->count(3)->create();

    $html = '<p>x</p>'.$products->map(fn (Product $p): string => embedMarker($p->slug))->implode('')
        .embedMarker($products[0]->slug); // repeated embed reuses the same lookup

    DB::enableQueryLog();
    $segments = app(BlogSegments::class)->handle($html);
    $queries = collect(DB::getQueryLog())->pluck('query');
    DB::disableQueryLog();

    expect(array_column($segments, 'type'))->toBe(['html', 'product', 'product', 'product', 'product']);

    $productSelects = $queries->filter(fn (string $sql): bool => (bool) preg_match('/^select .* from "products"/i', $sql));

    expect($productSelects)->toHaveCount(1);
});

// ---- B2.5: the post page ----

test('the post page sends product segments with clean data and no tracking parameters', function () {
    $product = Product::factory()->certified()->create();

    $post = BlogPost::factory()->published()->create([
        'body_html' => '<h2 id="a">A</h2>'.embedMarker($product->slug).'<p>Bye</p>',
    ]);

    $this->get(route('blog.show', $post))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/show')
            ->where('post.segments.0.type', 'html')
            ->where('post.segments.1.type', 'product')
            ->where('post.segments.1.product.slug', $product->slug)
            ->where('post.segments.2.type', 'html')
            ->where('post.segments', fn ($segments) => ! str_contains(json_encode($segments, JSON_THROW_ON_ERROR), 'utm_')));
});

test('a stale embed never breaks the post page', function () {
    $product = Product::factory()->create(['published' => false]);

    $post = BlogPost::factory()->published()->create([
        'body_html' => '<p>Hi</p>'.embedMarker($product->slug),
    ]);

    $this->get(route('blog.show', $post))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.segments', [['type' => 'html', 'html' => '<p>Hi</p>']]));
});
