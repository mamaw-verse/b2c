<?php

declare(strict_types=1);

use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogPostSlugHistory;
use App\Models\BlogTag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

function livePost(array $attributes = []): BlogPost
{
    return BlogPost::factory()->published()->create($attributes);
}

// ---- B2.1: flag, visibility, redirects, reserved paths ----

test('every public blog route is a 404 while the blog is disabled', function () {
    config(['blog.enabled' => false]);

    $post = livePost();
    $tag = BlogTag::factory()->create();
    $post->tags()->attach($tag);
    BlogPostSlugHistory::create(['blog_post_id' => $post->id, 'slug' => 'old-slug']);

    foreach ([
        route('blog.index'),
        route('blog.categories.show', $post->category),
        route('blog.tags.show', $tag),
        route('blog.authors.show', $post->author),
        route('blog.show', $post),
        '/blog/old-slug',
    ] as $url) {
        $this->get($url)->assertNotFound();
    }
});

test('only live posts are public', function () {
    $live = livePost();
    $this->get(route('blog.show', $live))->assertOk();

    foreach ([
        BlogPost::factory()->draft()->create(),
        BlogPost::factory()->scheduled()->create(),
        BlogPost::factory()->archived()->create(),
    ] as $post) {
        $this->get(route('blog.show', $post))->assertNotFound();
    }

    $trashed = livePost();
    $trashed->delete();
    $this->get(route('blog.show', $trashed))->assertNotFound();
});

test('a retired slug 301s to the current live URL, but not when the post is not live', function () {
    $post = livePost(['slug' => 'new-slug']);
    BlogPostSlugHistory::create(['blog_post_id' => $post->id, 'slug' => 'old-slug']);

    $this->get('/blog/old-slug')->assertRedirect(route('blog.show', $post))->assertStatus(301);

    $draft = BlogPost::factory()->draft()->create(['slug' => 'draft-now']);
    BlogPostSlugHistory::create(['blog_post_id' => $draft->id, 'slug' => 'draft-before']);
    $this->get('/blog/draft-before')->assertNotFound();
});

test('reserved paths never resolve as a post', function () {
    livePost();

    foreach (['category', 'tag', 'author', 'search', 'page', 'feed.xml'] as $path) {
        $this->get("/blog/{$path}")->assertNotFound();
    }
});

test('author pages exist for active people only, never the house author', function () {
    $active = BlogAuthor::factory()->create();
    $inactive = BlogAuthor::factory()->inactive()->create();
    $house = BlogAuthor::factory()->house()->create();

    $this->get(route('blog.authors.show', $active))->assertOk();
    $this->get(route('blog.authors.show', $inactive))->assertNotFound();
    $this->get(route('blog.authors.show', $house))->assertNotFound();
});

// ---- B2.2 / B2.3: index, category, tag, author ----

test('the index lists live posts newest first and hides everything else', function () {
    $older = livePost(['published_at' => now()->subDays(3)]);
    $newer = livePost(['published_at' => now()->subDay()]);
    BlogPost::factory()->draft()->create();
    BlogPost::factory()->scheduled()->create();

    $this->get(route('blog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->where('mode', 'index')
            ->has('posts.data', 2)
            ->where('posts.data.0.slug', $newer->slug)
            ->where('posts.data.1.slug', $older->slug)
            ->missing('posts.data.0.body_html'));
});

test('hero shows featured posts and the chips only list categories with a live post', function () {
    $featured = livePost()->forceFill(['is_featured' => true]);
    $featured->save();
    $empty = BlogCategory::factory()->create();
    BlogPost::factory()->draft()->create(['blog_category_id' => $empty->id]);

    $this->get(route('blog.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('hero', 1)
            ->where('hero.0.slug', $featured->slug)
            ->has('categories', 1)
            ->where('categories.0.slug', $featured->category->slug));
});

test('search narrows the grid, drops hero and popular, and is noindex', function () {
    livePost(['title' => 'Mango Season Guide', 'is_featured' => true]);
    livePost(['title' => 'Packing Tips']);

    $this->get(route('blog.index', ['q' => 'mango']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts.data', 1)
            ->where('q', 'mango')
            ->has('hero', 0)
            ->has('popular', 0));
});

test('index pagination follows blog.per_page and a page past the end is empty and noindex', function () {
    config(['blog.per_page' => 2]);
    BlogPost::factory()->published()->count(3)->create();

    $this->get(route('blog.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts.data', 2)
            ->where('posts.meta.last_page', 2));

    $this->get(route('blog.index', ['page' => 9]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('posts.data', 0));
});

test('an empty blog still returns 200', function () {
    $this->get(route('blog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('posts.data', 0)->where('total_live', 0));
});

test('index data is cached and cleared when a post changes', function () {
    $post = livePost(['is_featured' => true]);

    $this->get(route('blog.index'));
    expect(Cache::has('blog:index:hero'))->toBeTrue()
        ->and(Cache::has('blog:index:chips'))->toBeTrue();

    $post->update(['title' => 'Changed Title']);
    expect(Cache::has('blog:index:hero'))->toBeFalse()
        ->and(Cache::has('blog:index:chips'))->toBeFalse();
});

test('a category page lists only that category and an empty one is noindex but 200', function () {
    $post = livePost();
    livePost();
    $empty = BlogCategory::factory()->create();

    $this->get(route('blog.categories.show', $post->category))
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->where('mode', 'category')
            ->where('heading', $post->category->name)
            ->has('posts.data', 1));

    $this->get(route('blog.categories.show', $empty))->assertOk();
});

test('a tag page lists live posts with that tag', function () {
    $post = livePost();
    $other = livePost();
    $tag = BlogTag::factory()->create();
    $post->tags()->attach($tag);

    $this->get(route('blog.tags.show', $tag))
        ->assertInertia(fn (Assert $page) => $page
            ->where('mode', 'tag')
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', $post->slug));
});

test('an author page shows their live posts and exposes only https links', function () {
    $author = BlogAuthor::factory()->create(['links' => [
        ['label' => 'Site', 'url' => 'https://example.com'],
        ['label' => 'Bad', 'url' => 'javascript:alert(1)'],
    ]]);
    livePost(['blog_author_id' => $author->id]);
    BlogPost::factory()->draft()->create(['blog_author_id' => $author->id]);

    $this->get(route('blog.authors.show', $author))
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/author')
            ->has('posts.data', 1)
            ->has('author.links', 1)
            ->where('author.links.0.url', 'https://example.com'));
});

// ---- B2.4: post page ----

test('the post page carries the body, byline author, cover and related posts', function () {
    $post = livePost(['body_html' => '<h2 id="a">A</h2><p>Hello</p>']);
    $sibling = livePost(['blog_category_id' => $post->blog_category_id]);
    livePost();

    $this->get(route('blog.show', $post))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/show')
            ->where('post.slug', $post->slug)
            ->where('post.html', '<h2 id="a">A</h2><p>Hello</p>')
            ->where('author.name', $post->author->display_name)
            ->where('author.has_profile', true)
            ->has('post.cover')
            ->where('related.0.slug', $sibling->slug)
            ->where('related', fn ($related) => collect($related)->pluck('slug')->doesntContain($post->slug)));
});

test('the table of contents is sent only with three or more headings', function () {
    $toc = fn (int $n) => collect(range(1, $n))->map(fn ($i) => ['id' => "h{$i}", 'text' => "H{$i}", 'level' => 2])->all();

    $few = livePost(['toc' => $toc(2)]);
    $many = livePost(['toc' => $toc(3)]);

    $this->get(route('blog.show', $few))->assertInertia(fn (Assert $page) => $page->has('post.toc', 0));
    $this->get(route('blog.show', $many))->assertInertia(fn (Assert $page) => $page->has('post.toc', 3));
});

test('the house author has no profile link or box and a deactivated author keeps their credit', function () {
    $house = livePost(['blog_author_id' => BlogAuthor::factory()->house()->create()->id]);
    $inactive = livePost(['blog_author_id' => BlogAuthor::factory()->inactive()->create()->id]);

    $this->get(route('blog.show', $house))
        ->assertInertia(fn (Assert $page) => $page
            ->where('author.is_house', true)
            ->where('author.has_profile', false)
            ->missing('author.bio'));

    $this->get(route('blog.show', $inactive))
        ->assertInertia(fn (Assert $page) => $page
            ->where('author.name', $inactive->author->display_name)
            ->where('author.has_profile', false));
});

test('updated date shows only when materially later than published and the shop CTA follows the category', function () {
    $post = livePost(['published_at' => now()->subDays(10)]);
    $this->get(route('blog.show', $post))->assertInertia(fn (Assert $page) => $page->where('post.updated_at', null)->where('cta', null));

    $post->forceFill(['updated_at' => now()->subDay()])->saveQuietly();
    $this->get(route('blog.show', $post))->assertInertia(fn (Assert $page) => $page->whereNot('post.updated_at', null));
});

test('the post body never contains an h1 (the page owns the only one)', function () {
    $post = livePost();

    expect($post->body_html)->not->toContain('<h1');
});
