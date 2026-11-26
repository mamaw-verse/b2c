<?php

declare(strict_types=1);

use App\Models\BlogPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

// ---- B2.6: home strip ----

test('the home page shows the three latest posts once at least three are live', function () {
    $oldest = BlogPost::factory()->published()->create(['published_at' => now()->subDays(5)]);
    $middle = BlogPost::factory()->published()->create(['published_at' => now()->subDays(3)]);
    $newest = BlogPost::factory()->published()->create(['published_at' => now()->subDay()]);
    $newer = BlogPost::factory()->published()->create(['published_at' => now()->subHours(2)]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('blogPosts', 3)
            ->where('blogPosts.0.slug', $newer->slug)
            ->where('blogPosts.1.slug', $newest->slug)
            ->where('blogPosts.2.slug', $middle->slug)
            ->where('blogPosts', fn ($posts) => collect($posts)->pluck('slug')->doesntContain($oldest->slug)));
});

test('the home strip is hidden with fewer than three live posts', function () {
    BlogPost::factory()->published()->count(2)->create();
    // Drafts, scheduled and archived posts do not count towards the minimum.
    BlogPost::factory()->draft()->create();
    BlogPost::factory()->scheduled()->create();
    BlogPost::factory()->archived()->create();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('blogPosts', 0));
});

test('the home strip is hidden while the blog is disabled', function () {
    BlogPost::factory()->published()->count(4)->create();
    config(['blog.enabled' => false]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('blogPosts', 0));
});

test('publishing a post clears the cached home strip', function () {
    BlogPost::factory()->published()->count(2)->create();

    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->has('blogPosts', 0));

    // The empty strip is now cached; the third live post must bust it through the model observer.
    BlogPost::factory()->published()->create();

    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->has('blogPosts', 3));
});

// ---- B2.6: footer link ----

test('the footer links to the blog only while it is enabled', function () {
    $hasBlogLink = fn ($links) => collect($links)->contains('href', '/blog');

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('marketplace.footer.company', $hasBlogLink));

    config(['blog.enabled' => false]);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('marketplace.footer.company', fn ($links) => ! $hasBlogLink($links)));
});

test('the blog footer link is listed once', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where(
            'marketplace.footer.company',
            fn ($links) => collect($links)->where('href', '/blog')->count() === 1,
        ));
});
