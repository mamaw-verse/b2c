<?php

declare(strict_types=1);

use App\Actions\Blog\RenderBlogBody;
use App\Models\BlogImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    config(['app.url' => 'https://halalbenta.test', 'blog.nofollow_external' => true]);
});

function renderBlog(string $markdown): App\Support\Blog\RenderedBlogBody
{
    return app(RenderBlogBody::class)->handle($markdown);
}

test('headings shift down one level so the page has exactly one h1', function () {
    $out = renderBlog("# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six");

    expect($out->html)
        ->not->toContain('<h1')
        ->toContain('<h2 id="one">One</h2>')
        ->toContain('<h3 id="two">Two</h3>')
        ->toContain('<h4 id="three">Three</h4>')
        ->toContain('<h4 id="four">Four</h4>')
        ->toContain('<h4 id="five">Five</h4>')
        ->toContain('<h4 id="six">Six</h4>')
        ->not->toContain('<h5')
        ->not->toContain('<h6');
});

test('heading ids are slugified and de-duplicated, and the toc lists h2 and h3 only', function () {
    $out = renderBlog("# Halal tips\n\n## Halal tips\n\n## Halal tips\n\n### Deep dive\n\n#### Too deep\n\n# \n");

    expect($out->html)
        ->toContain('id="halal-tips"')
        ->toContain('id="halal-tips-2"')
        ->toContain('id="halal-tips-3"');

    expect($out->toc)->toBe([
        ['id' => 'halal-tips', 'text' => 'Halal tips', 'level' => 2],
        ['id' => 'halal-tips-2', 'text' => 'Halal tips', 'level' => 3],
        ['id' => 'halal-tips-3', 'text' => 'Halal tips', 'level' => 3],
    ]);
});

test('an empty heading still gets a valid id', function () {
    $out = renderBlog("# Real\n\n#\n");

    expect($out->html)->toContain('id="real"')->toContain('id="section"');
    expect($out->toc)->toBe([['id' => 'real', 'text' => 'Real', 'level' => 2]]);
});

test('word count and reading time use at least one minute', function () {
    $short = renderBlog('Just a few words here.');
    expect($short->wordCount)->toBe(5)->and($short->readingMinutes)->toBe(1);

    $long = renderBlog(str_repeat('word ', 450));
    expect($long->wordCount)->toBe(450)->and($long->readingMinutes)->toBe(3);

    $empty = renderBlog('');
    expect($empty->wordCount)->toBe(0)->and($empty->readingMinutes)->toBe(1)->and($empty->html)->toBe('');
});

test('external links open in a new tab with noopener noreferrer nofollow, internal links stay plain', function () {
    $out = renderBlog('[out](https://example.org/x) [in](https://halalbenta.test/products) [rel](/blog/post) [anchor](#top)');

    expect($out->html)
        ->toContain('href="https://example.org/x"')
        ->toContain('target="_blank"')
        ->toContain('rel="noopener noreferrer nofollow"');

    expect(substr_count($out->html, 'target="_blank"'))->toBe(1);
});

test('nofollow can be turned off', function () {
    config(['blog.nofollow_external' => false]);

    $out = renderBlog('[out](https://example.org/x)');

    expect($out->html)->toContain('rel="noopener noreferrer"')->not->toContain('nofollow');
});

test('protocol-relative links count as external', function () {
    expect(renderBlog('[x](//example.org/x)')->html)->toContain('target="_blank"');
});

test('hostile markdown does not survive', function () {
    $hostile = <<<'MD'
<script>alert(1)</script>

<img src=x onerror=alert(1)>

<iframe src="https://evil.example"></iframe>

<div style="position:fixed" onclick="x()">nested <b onmouseover="y()">html</b></div>

[js](javascript:alert(1))

[vb](vbscript:msgbox(1))

[data](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)

[file](file:///etc/passwd)

[ftp](ftp://example.org/x)

[entity](&#106;avascript:alert(1))

![remote](https://evil.example/x.png)

![data](data:image/png;base64,AAAA)

![relative](/storage/x.png)

Text ![inline](https://evil.example/y.png) more
MD;

    $out = renderBlog($hostile);
    $html = strtolower($out->html);

    foreach (['<script', '<iframe', 'onerror', 'onclick', 'onmouseover', 'style=', 'javascript:', 'vbscript:', 'data:', 'file:', 'ftp:', '<img', 'evil.example', '/etc/passwd'] as $needle) {
        expect($html)->not->toContain($needle);
    }

    expect($out->errors)->toBe([]);
    expect($out->warnings)->not->toBeEmpty();
});

test('a blog-image reference renders a responsive figure with a caption', function () {
    $image = BlogImage::factory()->purpose('body')->create(['alt' => 'Stored alt', 'caption' => 'Stored caption']);

    $out = renderBlog("![Dates on a plate](blog-image:{$image->id} \"A bowl of Ajwa dates\")");

    expect($out->html)
        ->toContain('<figure><img')
        ->toContain('srcset=')
        ->toContain('480w')
        ->toContain('960w')
        ->toContain('1600w')
        ->toContain('width="1600" height="900"')
        ->toContain('loading="lazy"')
        ->toContain('decoding="async"')
        ->toContain('alt="Dates on a plate"')
        ->toContain('<figcaption>A bowl of Ajwa dates</figcaption>')
        ->not->toContain('Stored caption');

    expect($out->imageIds)->toBe([$image->id]);
    expect($out->errors)->toBe([]);
});

test('a figure falls back to the stored alt and caption', function () {
    $image = BlogImage::factory()->purpose('body')->create(['alt' => 'Stored alt', 'caption' => 'Stored caption']);

    $out = renderBlog("![](blog-image:{$image->id})");
    expect($out->html)->toContain('alt="Stored alt"')->toContain('<figcaption>Stored caption</figcaption>');
});

test('figure text is escaped', function () {
    $image = BlogImage::factory()->purpose('body')->create(['alt' => 'x', 'caption' => '<b>"bold"</b>']);

    $out = renderBlog("![a \"quote\" & more](blog-image:{$image->id})");

    expect($out->html)->not->toContain('<b>')->toContain('&lt;b&gt;');
});

test('an unknown or malformed image id renders nothing and is an error', function () {
    $out = renderBlog("Before\n\n![x](blog-image:01hzzzzzzzzzzzzzzzzzzzzzzz)\n\n![y](blog-image:not-an-id)\n\nAfter");

    expect($out->html)->not->toContain('<figure')->not->toContain('<img')->toContain('Before')->toContain('After');
    expect($out->errors)->toHaveCount(2);
});

test('image ids are unique and the lookup is one batched query', function () {
    $a = BlogImage::factory()->purpose('body')->create();
    $b = BlogImage::factory()->purpose('body')->create();

    DB::enableQueryLog();
    $out = renderBlog("![a](blog-image:{$a->id})\n\n![b](blog-image:{$b->id})\n\n![a again](blog-image:{$a->id})");
    $queries = collect(DB::getQueryLog())->filter(fn ($q) => str_contains($q['query'], 'blog_images'))->count();
    DB::disableQueryLog();

    expect($out->imageIds)->toBe([$a->id, $b->id]);
    expect($queries)->toBe(1);
    expect(substr_count($out->html, '<figure>'))->toBe(3);
});

test('a standalone product token becomes a marker element', function () {
    $out = renderBlog("Intro\n\n[[product:halal-beef-tapa-500g]]\n\nOutro\n\n[[product:halal-beef-tapa-500g]]\n\n[[product:ajwa-dates]]");

    expect($out->html)
        ->toContain('<div data-blog-product="halal-beef-tapa-500g"></div>')
        ->toContain('<div data-blog-product="ajwa-dates"></div>');

    expect($out->productSlugs)->toBe(['halal-beef-tapa-500g', 'ajwa-dates']);
    expect($out->warnings)->toBe([]);
});

test('an inline product token is ignored and warned about', function () {
    $out = renderBlog('Try [[product:ajwa-dates]] today.');

    expect($out->html)->not->toContain('data-blog-product');
    expect($out->productSlugs)->toBe([]);
    expect($out->warnings)->toHaveCount(1);
});

test('a product token with an invalid slug is not an embed', function () {
    $out = renderBlog("[[product:Bad_Slug!]]\n\n[[product:\"><script>]]");

    expect($out->html)->not->toContain('data-blog-product')->not->toContain('<script');
    expect($out->productSlugs)->toBe([]);
});

test('a product token typed inside a code block stays literal text', function () {
    $out = renderBlog("```\n[[product:ajwa-dates]]\n```");

    expect($out->html)->toContain('<pre><code>')->not->toContain('data-blog-product');
    expect($out->productSlugs)->toBe([]);
});

test('ordinary markdown still renders', function () {
    $out = renderBlog("A **bold** and *italic* line.\n\n- one\n- two\n\n> quote\n\n1. first\n2. second");

    expect($out->html)
        ->toContain('<strong>bold</strong>')
        ->toContain('<em>italic</em>')
        ->toContain('<ul>')
        ->toContain('<blockquote>')
        ->toContain('<ol>');
});
