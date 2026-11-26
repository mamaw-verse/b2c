<?php

declare(strict_types=1);

use App\Actions\Blog\ListBlogPostsFeaturingProduct;
use App\Models\BlogPost;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

/** Attaches a product to a post the way `SyncBlogPostRelations` does after a save. */
function attachEmbed(BlogPost $post, Product $product, int $order = 0): void
{
    $post->products()->attach($product->id, ['sort_order' => $order]);
}

test('only live posts that embed the product are listed, newest first', function () {
    $product = Product::factory()->create();
    $older = BlogPost::factory()->published()->create(['published_at' => now()->subDays(4)]);
    $newer = BlogPost::factory()->published()->create(['published_at' => now()->subDay()]);
    $draft = BlogPost::factory()->draft()->create();
    $scheduled = BlogPost::factory()->scheduled()->create();
    $archived = BlogPost::factory()->archived()->create();
    $unrelated = BlogPost::factory()->published()->create();

    foreach ([$older, $newer, $draft, $scheduled, $archived] as $post) {
        attachEmbed($post, $product);
    }

    $cards = app(ListBlogPostsFeaturingProduct::class)->handle($product);

    expect(array_column($cards, 'slug'))->toBe([$newer->slug, $older->slug])
        ->and($cards[0])->toHaveKeys(['id', 'title', 'slug', 'excerpt', 'published_at', 'reading_minutes', 'category', 'image'])
        ->and($cards[0])->not->toHaveKey('body_html');
});

test('at most three posts are listed', function () {
    $product = Product::factory()->create();

    BlogPost::factory()->published()->count(5)
        ->sequence(fn ($sequence) => ['published_at' => now()->subHours($sequence->index + 1)])
        ->create()
        ->each(fn (BlogPost $post) => attachEmbed($post, $product));

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($product))->toHaveCount(3);
});

test('another product is not affected by a post that embeds this one', function () {
    $product = Product::factory()->create();
    $other = Product::factory()->create();
    attachEmbed(BlogPost::factory()->published()->create(), $product);

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($other))->toBe([]);
});

test('nothing is listed while the blog is disabled', function () {
    $product = Product::factory()->create();
    attachEmbed(BlogPost::factory()->published()->create(), $product);

    config(['blog.enabled' => false]);

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($product))->toBe([]);
});

test('the product page carries the featured_in prop', function () {
    $product = Product::factory()->create();
    $post = BlogPost::factory()->published()->create();
    attachEmbed($post, $product);

    $this->get(route('products.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('product')
            ->has('featured_in', 1)
            ->where('featured_in.0.slug', $post->slug));
});

test('the product page prop is empty without posts and with the blog off', function () {
    $product = Product::factory()->create();
    $this->get(route('products.show', $product))
        ->assertInertia(fn (Assert $page) => $page->has('featured_in', 0));

    attachEmbed(BlogPost::factory()->published()->create(), $product);
    config(['blog.enabled' => false]);

    $this->get(route('products.show', $product))
        ->assertInertia(fn (Assert $page) => $page->has('featured_in', 0));
});

test('editing a post to embed a product makes it appear on that product page', function () {
    $product = Product::factory()->create();
    $post = BlogPost::factory()->published()->create();

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($product))->toBe([]);

    attachEmbed($post, $product);

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($product))->toHaveCount(1);

    $post->products()->sync([]);

    expect(app(ListBlogPostsFeaturingProduct::class)->handle($product))->toBe([]);
});
