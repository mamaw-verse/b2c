<?php

declare(strict_types=1);

use App\Models\BlogAuthor;
use App\Models\BlogPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true]);
    Cache::flush();
});

test('the feed is RSS 2.0 with only live posts, newest first, excerpts only', function () {
    $older = BlogPost::factory()->published()->create(['title' => 'Older story', 'published_at' => now()->subDays(3)]);
    $newer = BlogPost::factory()->published()->create(['title' => 'Newer story', 'published_at' => now()->subDay(), 'body_html' => '<p>SECRET-BODY-TEXT</p>']);
    BlogPost::factory()->draft()->create(['title' => 'Hidden draft']);
    BlogPost::factory()->scheduled()->create(['title' => 'Hidden scheduled']);
    BlogPost::factory()->archived()->create(['title' => 'Hidden archived']);

    $response = $this->get(route('blog.feed'))->assertOk();
    $xml = $response->getContent();

    expect($xml)->toStartWith('<?xml')
        ->and($xml)->toContain('<rss version="2.0"')
        ->and($xml)->toContain('<language>en-PH</language>')
        ->and($xml)->toContain('<guid isPermaLink="true">'.route('blog.show', $newer).'</guid>')
        ->and($xml)->toContain($newer->excerpt)
        ->and($xml)->not->toContain('SECRET-BODY-TEXT')
        ->and($xml)->not->toContain('Hidden')
        ->and(mb_strpos($xml, 'Newer story'))->toBeLessThan(mb_strpos($xml, 'Older story'));

    // Well-formed XML.
    $parsed = simplexml_load_string($xml);
    expect($parsed)->not->toBeFalse()
        ->and(count($parsed->channel->item))->toBe(2);
});

test('the feed credits the author, never the internal creator, and escapes markup', function () {
    $author = BlogAuthor::factory()->create(['display_name' => 'Amina <b>& Co</b>']);
    BlogPost::factory()->published()->create(['blog_author_id' => $author->id, 'title' => 'Tom & "Jerry" <script>']);

    $xml = $this->get(route('blog.feed'))->getContent();

    expect($xml)->toContain('<dc:creator>Amina &lt;b&gt;&amp; Co&lt;/b&gt;</dc:creator>')
        ->and($xml)->not->toContain('<script>')
        ->and(simplexml_load_string($xml))->not->toBeFalse();
});

test('the feed is limited to the 20 newest posts', function () {
    BlogPost::factory()->published()->count(23)->sequence(fn ($sequence) => ['published_at' => now()->subHours($sequence->index + 1)])->create();

    $parsed = simplexml_load_string($this->get(route('blog.feed'))->getContent());

    expect(count($parsed->channel->item))->toBe(20);
});

test('publishing a post clears the cached feed', function () {
    $post = BlogPost::factory()->published()->create(['title' => 'First one']);
    $this->get(route('blog.feed'))->assertSee('First one');

    BlogPost::factory()->published()->create(['title' => 'Second one']);

    $this->get(route('blog.feed'))->assertSee('Second one')->assertSee($post->title);
});

test('blog pages advertise the feed and other pages do not', function () {
    $post = BlogPost::factory()->published()->create();

    $this->get(route('blog.index'))->assertSee('rel="alternate" type="application/rss+xml"', false)->assertSee(route('blog.feed'), false);
    $this->get(route('blog.show', $post))->assertSee('type="application/rss+xml"', false);
    $this->get(route('home'))->assertDontSee('type="application/rss+xml"', false);
});
