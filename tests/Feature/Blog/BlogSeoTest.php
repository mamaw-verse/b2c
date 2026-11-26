<?php

declare(strict_types=1);

use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Support\Schema\JsonLdValidator;
use App\Support\Schema\SchemaId;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Image URLs come from the disk config, which was resolved from APP_URL at boot, so the
    // runtime app.url override has to be mirrored there (then the cached disk is dropped).
    config([
        'blog.enabled' => true,
        'app.url' => 'https://halalbenta.test',
        'filesystems.disks.public.url' => 'https://halalbenta.test/storage',
    ]);
    Storage::forgetDisk('public');
    Cache::flush();
});

function seoPost(array $attributes = []): BlogPost
{
    return BlogPost::factory()->published()->create($attributes);
}

/** @return array<string, mixed> */
function jsonLdOf(string $html): array
{
    $blocks = (new JsonLdValidator)->extract($html);

    return json_decode($blocks[0], true, flags: JSON_THROW_ON_ERROR);
}

/** @return array<string, mixed>|null */
function graphNode(array $document, string $type): ?array
{
    foreach ($document['@graph'] as $node) {
        if (($node['@type'] ?? null) === $type) {
            return $node;
        }
    }

    return null;
}

function metaContent(string $html, string $attribute, string $name): ?string
{
    $quoted = preg_quote($name, '#');
    preg_match('#<meta '.$attribute.'="'.$quoted.'" content="([^"]*)"#', $html, $m);

    return isset($m[1]) ? html_entity_decode($m[1]) : null;
}

/** @return list<string> */
function metaContents(string $html, string $attribute, string $name): array
{
    preg_match_all('#<meta '.$attribute.'="'.preg_quote($name, '#').'" content="([^"]*)"#', $html, $m);

    return array_map('html_entity_decode', $m[1]);
}

function sitewide(): array
{
    return [SchemaId::organization(), SchemaId::website()];
}

// ---- B3.1: JSON-LD ----

test('a post emits a valid BlogPosting graph: post -> person -> organization', function () {
    $author = BlogAuthor::factory()->create(['links' => [
        ['label' => 'Site', 'url' => 'https://example.com'],
        ['label' => 'Bad', 'url' => 'http://insecure.example'],
    ]]);
    $post = seoPost(['blog_author_id' => $author->id]);
    $post->tags()->attach(BlogTag::factory()->create(['name' => 'Dates']));

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([]);

    $document = jsonLdOf($html);
    $article = graphNode($document, 'BlogPosting');
    $person = graphNode($document, 'Person');

    expect($article['@id'])->toBe("https://halalbenta.test/blog/{$post->slug}#article")
        ->and($article['headline'])->not->toBeEmpty()
        ->and($article['image'])->not->toBeEmpty()
        ->and($article['datePublished'])->toBe($post->published_at->toIso8601String())
        ->and($article['author'])->toBe(['@id' => SchemaId::person($author->slug)])
        ->and($article['publisher'])->toBe(['@id' => SchemaId::organization()])
        ->and($article['articleSection'])->toBe($post->category->name)
        ->and($article['keywords'])->toBe('Dates')
        ->and($article['inLanguage'])->toBe('en-PH')
        ->and($person['@id'])->toBe(SchemaId::person($author->slug))
        ->and($person['name'])->toBe($author->display_name)
        ->and($person['sameAs'])->toBe(['https://example.com'])
        ->and($person['url'])->toBe("https://halalbenta.test/blog/author/{$author->slug}");

    foreach ((array) $article['image'] as $image) {
        expect($image)->toStartWith('https://');
    }
});

test('the house author is the Organization, never a Person', function () {
    $post = seoPost(['blog_author_id' => BlogAuthor::factory()->house()->create()->id]);

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();
    $document = jsonLdOf($html);

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([])
        ->and(graphNode($document, 'BlogPosting')['author'])->toBe(['@id' => SchemaId::organization()])
        ->and(graphNode($document, 'Person'))->toBeNull();
});

test('a deactivated author is still credited but their Person has no url', function () {
    $author = BlogAuthor::factory()->inactive()->create();
    $post = seoPost(['blog_author_id' => $author->id]);

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([])
        ->and(graphNode(jsonLdOf($html), 'Person'))->not->toHaveKey('url')
        ->and(metaContent($html, 'property', 'article:author'))->toBeNull();
});

test('the index emits a Blog node and an ItemList whose stubs share the post ids', function () {
    $posts = BlogPost::factory()->published()->count(2)->create();

    $html = $this->get(route('blog.index'))->assertOk()->getContent();
    $document = jsonLdOf($html);

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([]);

    $blog = graphNode($document, 'Blog');
    $list = graphNode($document, 'ItemList');
    $ids = $posts->map(fn ($post) => SchemaId::blogPost($post->slug))->all();

    expect($blog['@id'])->toBe(SchemaId::blog())
        ->and(collect($blog['blogPost'])->pluck('@id')->sort()->values()->all())->toBe(collect($ids)->sort()->values()->all())
        ->and(collect($list['itemListElement'])->pluck('item.@id')->sort()->values()->all())->toBe(collect($ids)->sort()->values()->all())
        ->and(graphNode($document, 'CollectionPage')['mainEntity'])->toBe(['@id' => SchemaId::blog()]);
});

test('search results declare no posts', function () {
    seoPost(['title' => 'Mango Guide']);

    $html = $this->get(route('blog.index', ['q' => 'mango']))->assertOk()->getContent();

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([])
        ->and(graphNode(jsonLdOf($html), 'ItemList'))->toBeNull();
});

test('category, tag and author pages pass the validator, and the author page links ProfilePage to Person', function () {
    $post = seoPost();
    $tag = BlogTag::factory()->create();
    $post->tags()->attach($tag);

    foreach ([route('blog.categories.show', $post->category), route('blog.tags.show', $tag)] as $url) {
        $html = $this->get($url)->assertOk()->getContent();
        expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([]);
    }

    $html = $this->get(route('blog.authors.show', $post->author))->assertOk()->getContent();
    $document = jsonLdOf($html);

    expect((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([])
        ->and(graphNode($document, 'ProfilePage')['mainEntity'])->toBe(['@id' => SchemaId::person($post->author->slug)])
        ->and(graphNode($document, 'Person')['name'])->toBe($post->author->display_name);
});

test('hostile titles and bios cannot break out of the JSON-LD script or the meta tags', function () {
    $author = BlogAuthor::factory()->create(['bio' => '</script><script>alert("bio")</script>']);
    $post = seoPost([
        'blog_author_id' => $author->id,
        'title' => '</script><script>alert("title")</script>',
        'seo_description' => '"><script>alert("desc")</script>',
    ]);

    foreach ([route('blog.show', $post), route('blog.authors.show', $author), route('blog.index')] as $url) {
        $html = $this->get($url)->assertOk()->getContent();

        expect($html)->not->toContain('<script>alert(')
            ->and((new JsonLdValidator)->extract($html))->toHaveCount(1)
            ->and((new JsonLdValidator)->validateHtml($html, sitewide())['errors'])->toBe([]);
    }
});

// ---- B3.2: Open Graph / Twitter ----

test('a post carries article Open Graph tags with the author page and tags', function () {
    $post = seoPost();
    $post->tags()->attach([
        BlogTag::factory()->create(['name' => 'Dates'])->id,
        BlogTag::factory()->create(['name' => 'Ramadan'])->id,
    ]);

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

    expect(metaContent($html, 'property', 'og:type'))->toBe('article')
        ->and(metaContent($html, 'property', 'article:published_time'))->toBe($post->published_at->toIso8601String())
        ->and(metaContent($html, 'property', 'article:modified_time'))->not->toBeNull()
        ->and(metaContent($html, 'property', 'article:section'))->toBe($post->category->name)
        ->and(metaContent($html, 'property', 'article:author'))->toBe("https://halalbenta.test/blog/author/{$post->author->slug}")
        ->and(metaContents($html, 'property', 'article:tag'))->toEqualCanonicalizing(['Dates', 'Ramadan'])
        ->and(metaContent($html, 'name', 'twitter:card'))->toBe('summary_large_image')
        ->and(metaContent($html, 'name', 'twitter:label2'))->toBe('Reading time');
});

test('the house author post has no article:author', function () {
    $post = seoPost(['blog_author_id' => BlogAuthor::factory()->house()->create()->id]);

    expect(metaContent($this->get(route('blog.show', $post))->getContent(), 'property', 'article:author'))->toBeNull();
});

test('every live post has an absolute og:image with dimensions from the og variant', function () {
    $posts = BlogPost::factory()->published()->count(3)->create();

    foreach ($posts as $post) {
        $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

        expect(metaContent($html, 'property', 'og:image'))->toStartWith('https://halalbenta.test/')
            ->and(metaContent($html, 'property', 'og:image'))->toEndWith('-og.jpg')
            ->and(metaContent($html, 'property', 'og:image:width'))->toBe('1200')
            ->and(metaContent($html, 'property', 'og:image:height'))->toBe('630')
            ->and(metaContent($html, 'property', 'og:image:type'))->toBe('image/jpeg')
            ->and(metaContent($html, 'property', 'og:image:alt'))->not->toBeEmpty();
    }
});

test('without an og variant the large cover is used, with its real dimensions', function () {
    $post = seoPost();
    $variants = $post->coverImage->variants;
    unset($variants['og']);
    $post->coverImage->update(['variants' => $variants]);

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

    expect(metaContent($html, 'property', 'og:image'))->toEndWith('-1600.webp')
        ->and(metaContent($html, 'property', 'og:image:width'))->toBe('1600')
        ->and(metaContent($html, 'property', 'og:image:height'))->toBe('900');
});

test('listing pages use the site default og image', function () {
    $html = $this->get(route('blog.index'))->assertOk()->getContent();

    expect(metaContent($html, 'property', 'og:type'))->toBe('website')
        ->and(metaContent($html, 'property', 'og:image'))->toStartWith('https://halalbenta.test/');
});

// ---- Canonicals and robots ----

test('titles follow the pattern and the post canonical is self-referencing', function () {
    $post = seoPost(['seo_title' => null]);

    $html = $this->get(route('blog.show', $post))->getContent();

    expect($html)->toContain('<link rel="canonical" href="https://halalbenta.test/blog/'.$post->slug.'">')
        ->and($html)->toContain(e($post->title).' | HalalBenta Blog</title>');
});

test('paginated listings self-canonicalise with prev/next and pages past the end are noindex', function () {
    config(['blog.per_page' => 2]);
    BlogPost::factory()->published()->count(5)->create();

    $page2 = $this->get(route('blog.index', ['page' => 2]))->getContent();
    expect($page2)->toContain('<link rel="canonical" href="https://halalbenta.test/blog?page=2">')
        ->and($page2)->toContain('<link rel="prev" href="https://halalbenta.test/blog">')
        ->and($page2)->toContain('<link rel="next" href="https://halalbenta.test/blog?page=3">');

    expect($this->get(route('blog.index', ['page' => 9]))->getContent())
        ->toContain('<meta name="robots" content="noindex, follow">');
});

test('search results, thin tags and authors without a live post are noindex', function () {
    $post = seoPost();
    $tag = BlogTag::factory()->create();
    $post->tags()->attach($tag);
    $bare = BlogAuthor::factory()->create();
    $noindex = '<meta name="robots" content="noindex, follow">';

    expect($this->get(route('blog.index', ['q' => 'x']))->getContent())->toContain($noindex)
        ->and($this->get(route('blog.tags.show', $tag))->getContent())->toContain($noindex)
        ->and($this->get(route('blog.authors.show', $bare))->getContent())->toContain($noindex)
        ->and($this->get(route('blog.authors.show', $post->author))->getContent())->not->toContain($noindex)
        ->and($this->get(route('blog.index'))->getContent())->not->toContain($noindex);
});

test('a tag with three live posts is indexable', function () {
    $tag = BlogTag::factory()->create();
    BlogPost::factory()->published()->count(3)->create()->each(fn ($post) => $post->tags()->attach($tag));

    expect($this->get(route('blog.tags.show', $tag))->getContent())
        ->not->toContain('<meta name="robots" content="noindex, follow">');
});

test('an empty category is 200 but noindex', function () {
    $empty = BlogCategory::factory()->create();

    expect($this->get(route('blog.categories.show', $empty))->assertOk()->getContent())
        ->toContain('<meta name="robots" content="noindex, follow">');
});

// ---- B3.3: sitemap ----

/** @return array<string, string|null> loc => lastmod */
function blogSitemapEntries(): array
{
    $xml = simplexml_load_string(test()->get('/sitemap-blog.xml')->assertOk()->getContent());
    $entries = [];
    foreach ($xml->url as $url) {
        $entries[(string) $url->loc] = isset($url->lastmod) ? (string) $url->lastmod : null;
    }

    return $entries;
}

test('the blog sitemap 404s while the blog is off and is not listed in the index', function () {
    config(['blog.enabled' => false]);
    seoPost();

    $this->get('/sitemap-blog.xml')->assertNotFound();
    expect($this->get('/sitemap.xml')->getContent())->not->toContain('sitemap-blog.xml');
});

test('the index lists the blog sitemap only when there is a live post', function () {
    expect($this->get('/sitemap.xml')->getContent())->not->toContain('sitemap-blog.xml');

    $post = seoPost();

    // Iterating a SimpleXMLElement repeats the key `sitemap`, so collect() would keep only the last entry.
    $xml = simplexml_load_string($this->get('/sitemap.xml')->assertOk()->getContent());
    $entries = [];
    foreach ($xml->sitemap as $sitemap) {
        $entries[(string) $sitemap->loc] = $sitemap;
    }

    expect($entries)->toHaveKey('https://halalbenta.test/sitemap-blog.xml')
        ->and((string) $entries['https://halalbenta.test/sitemap-blog.xml']->lastmod)->toBe($post->updated_at->toIso8601String());
});

test('the blog sitemap lists live posts, categories and authors with posts, and nothing else', function () {
    $live = seoPost();
    $draft = BlogPost::factory()->draft()->create();
    $scheduled = BlogPost::factory()->scheduled()->create();
    $archived = BlogPost::factory()->archived()->create();
    $houseCategoryless = BlogCategory::factory()->create();
    $inactive = BlogAuthor::factory()->inactive()->create();
    $inactivePost = seoPost(['blog_author_id' => $inactive->id]);
    $housePost = seoPost(['blog_author_id' => BlogAuthor::factory()->house()->create()->id]);

    $entries = blogSitemapEntries();
    $origin = 'https://halalbenta.test';

    expect($entries)->toHaveKey("{$origin}/blog")
        ->and($entries)->toHaveKey("{$origin}/blog/{$live->slug}")
        ->and($entries)->toHaveKey("{$origin}/blog/{$inactivePost->slug}")
        ->and($entries)->toHaveKey("{$origin}/blog/category/{$live->category->slug}")
        ->and($entries)->toHaveKey("{$origin}/blog/author/{$live->author->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/{$draft->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/{$scheduled->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/{$archived->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/category/{$houseCategoryless->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/author/{$inactive->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/author/{$housePost->author->slug}");
});

test('tags appear in the sitemap only with three live posts, and lastmod is the real updated_at', function () {
    $thin = BlogTag::factory()->create();
    $full = BlogTag::factory()->create();
    $posts = BlogPost::factory()->published()->count(3)->create();
    $posts->each(fn ($post) => $post->tags()->attach($full));
    $posts->first()->tags()->attach($thin);

    $stamp = Carbon::parse('2026-03-04 10:00:00');
    $posts->first()->forceFill(['updated_at' => $stamp])->saveQuietly();
    Cache::flush();

    $entries = blogSitemapEntries();
    $origin = 'https://halalbenta.test';

    expect($entries)->toHaveKey("{$origin}/blog/tag/{$full->slug}")
        ->and($entries)->not->toHaveKey("{$origin}/blog/tag/{$thin->slug}")
        ->and($entries["{$origin}/blog/{$posts->first()->slug}"])->toBe($stamp->toIso8601String());
});

test('publishing clears the cached blog sitemap and index', function () {
    $first = seoPost();
    expect(array_keys(blogSitemapEntries()))->toContain('https://halalbenta.test/blog/'.$first->slug);

    $second = seoPost();

    expect(array_keys(blogSitemapEntries()))->toContain('https://halalbenta.test/blog/'.$second->slug);
});

test('no static sitemap file shadows the blog sitemap route', function () {
    expect(glob(public_path('sitemap*.xml')))->toBe([]);
});

// ---- B3.4: llms.txt and robots ----

test('llms.txt gets a Blog section with the latest live posts only', function () {
    $this->app['env'] = 'production';
    $live = seoPost(['excerpt' => "A guide\n to dates."]);
    $draft = BlogPost::factory()->draft()->create();

    $body = $this->get('https://halalbenta.test/llms.txt')->assertOk()->getContent();

    expect($body)->toContain('## Blog')
        ->and($body)->toContain("[{$live->title}](https://halalbenta.test/blog/{$live->slug}): A guide to dates.")
        ->and($body)->toContain('https://halalbenta.test/blog)')
        ->and($body)->not->toContain($draft->slug);
});

test('llms.txt lists at most the 10 newest posts', function () {
    $this->app['env'] = 'production';
    $posts = collect(range(1, 12))->map(fn ($i) => seoPost(['published_at' => now()->subDays($i)]));

    $body = $this->get('https://halalbenta.test/llms.txt')->assertOk()->getContent();

    expect($body)->toContain($posts[0]->slug)
        ->and($body)->toContain($posts[9]->slug)
        ->and($body)->not->toContain($posts[10]->slug)
        ->and($body)->not->toContain($posts[11]->slug);
});

test('llms.txt has no Blog section when the blog is off or empty', function () {
    $this->app['env'] = 'production';

    expect($this->get('https://halalbenta.test/llms.txt')->getContent())->not->toContain('## Blog');

    seoPost();
    Cache::flush();
    config(['blog.enabled' => false]);

    expect($this->get('https://halalbenta.test/llms.txt')->getContent())->not->toContain('## Blog');
});

test('robots.txt disallows the q search parameter', function () {
    $this->app['env'] = 'production';

    expect($this->get('https://halalbenta.test/robots.txt')->assertOk()->getContent())->toContain('Disallow: /*?*q=');
});
