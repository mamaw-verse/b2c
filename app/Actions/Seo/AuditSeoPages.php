<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Enums\ShopStatus;
use App\Models\BlogAuthor;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Support\Schema\JsonLdValidator;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Weekly SEO health check (docs/planning/14 T5.4).
 *
 * Fetches the *live* HTML of the home page, the static public pages and a random sample of
 * categories, shops and products, then checks:
 *
 *  - the page answers 200 and its JSON-LD passes {@see JsonLdValidator};
 *  - every image URL named in JSON-LD, `og:image` or `twitter:image` answers 200;
 *  - sitemap index and every child sitemap answer 200 with URLs on the canonical host;
 *  - `/robots.txt` answers 200 (and `/llms.txt` where the app serves it);
 *  - the product name is in the server-rendered body, not only in the Inertia payload
 *    (the crawler smoke test from T0.7; a warning unless `$requireSsr`).
 *
 * It never writes data; the caller decides how to report the result.
 */
final readonly class AuditSeoPages
{
    private const int MAX_IMAGES = 60;

    private const int TIMEOUT_SECONDS = 15;

    public function __construct(
        private JsonLdValidator $validator,
        private BuildLlmsTxt $llms,
    ) {}

    /**
     * `checked` counts pages and images fetched, not sitemap or robots probes.
     *
     * @return array{checked: int, failures: list<array{url: string, problem: string}>, warnings: list<array{url: string, problem: string}>}
     */
    public function handle(string $baseUrl, int $sample = 10, bool $requireSsr = false): array
    {
        $baseUrl = mb_rtrim($baseUrl, '/');
        $failures = [];
        $warnings = [];
        $checked = 0;
        $images = [];

        foreach ($this->pageTargets($sample) as $target) {
            $url = $baseUrl.$target['path'];
            $checked++;

            $response = $this->get($url);

            if (! $response instanceof Response) {
                $failures[] = ['url' => $url, 'problem' => 'Request failed (timeout or connection error).'];

                continue;
            }

            if ($response->status() !== 200) {
                $failures[] = ['url' => $url, 'problem' => "HTTP {$response->status()}, expected 200."];

                continue;
            }

            $html = $response->body();
            $result = $this->validator->validateHtml($html, [SchemaId::organization(), SchemaId::website()]);

            foreach ($result['errors'] as $error) {
                $failures[] = ['url' => $url, 'problem' => "JSON-LD: {$error}"];
            }

            foreach ($result['warnings'] as $warning) {
                $warnings[] = ['url' => $url, 'problem' => "JSON-LD: {$warning}"];
            }

            foreach ($this->imageUrlsIn($html) as $image) {
                $images[$image] = $url;
            }

            if ($target['name'] !== null && ! $this->bodyContains($html, $target['name'])) {
                $problem = 'Product name is missing from the server-rendered body (is Inertia SSR running?).';

                if ($requireSsr) {
                    $failures[] = ['url' => $url, 'problem' => $problem];
                } else {
                    $warnings[] = ['url' => $url, 'problem' => $problem];
                }
            }
        }

        foreach ($this->checkSitemaps($baseUrl) as $problem) {
            $failures[] = $problem;
        }

        foreach ($this->checkTextEndpoints($baseUrl) as $problem) {
            $failures[] = $problem;
        }

        foreach (array_slice($images, 0, self::MAX_IMAGES, true) as $image => $foundOn) {
            $checked++;

            if (! $this->imageResolves((string) $image)) {
                $failures[] = ['url' => (string) $image, 'problem' => "Image does not answer 200 (referenced on {$foundOn})."];
            }
        }

        return ['checked' => $checked, 'failures' => $failures, 'warnings' => $warnings];
    }

    /**
     * @return list<array{path: string, name: string|null}>
     */
    private function pageTargets(int $sample): array
    {
        $targets = array_map(
            static fn (string $path): array => ['path' => $path, 'name' => null],
            ['/', '/sellers', '/why-choose-us', '/seller/terms'],
        );

        foreach (Category::query()->inRandomOrder()->limit(2)->pluck('slug') as $slug) {
            $targets[] = ['path' => "/categories/{$slug}", 'name' => null];
        }

        $shops = Shop::query()
            ->where('status', ShopStatus::Approved)
            ->where('suspended', false)
            ->inRandomOrder()
            ->limit(2)
            ->pluck('slug');

        foreach ($shops as $slug) {
            $targets[] = ['path' => "/shops/{$slug}", 'name' => null];
        }

        // Blog samples (only while the blog is on): the index, the 2 latest posts and one author page.
        if (config()->boolean('blog.enabled', false)) {
            $targets[] = ['path' => '/blog', 'name' => null];

            foreach (BlogPost::query()->live()->orderByDesc('published_at')->limit(2)->get(['slug', 'title']) as $post) {
                $targets[] = ['path' => "/blog/{$post->slug}", 'name' => $post->title];
            }

            $author = BlogAuthor::query()
                ->where('is_active', true)
                ->where('is_house', false)
                ->whereHas('posts', fn ($query) => $query->live())
                ->inRandomOrder()
                ->first(['slug']);

            if ($author !== null) {
                $targets[] = ['path' => "/blog/author/{$author->slug}", 'name' => null];
            }
        }

        $products = Product::visible()->inRandomOrder()->limit(max(0, $sample))->get(['slug', 'name']);

        foreach ($products as $product) {
            $targets[] = ['path' => "/products/{$product->slug}", 'name' => $product->name];
        }

        return $targets;
    }

    /**
     * @return list<array{url: string, problem: string}>
     */
    private function checkSitemaps(string $baseUrl): array
    {
        $problems = [];
        $index = $this->get("{$baseUrl}/sitemap.xml");

        if (! $index instanceof Response || $index->status() !== 200) {
            return [['url' => "{$baseUrl}/sitemap.xml", 'problem' => 'Sitemap index did not answer 200.']];
        }

        preg_match_all('#<loc>(.*?)</loc>#', $index->body(), $matches);
        $children = array_map(html_entity_decode(...), $matches[1]);

        if ($children === []) {
            $problems[] = ['url' => "{$baseUrl}/sitemap.xml", 'problem' => 'Sitemap index lists no child sitemaps.'];
        }

        $canonicalHost = parse_url(SeoData::canonicalOrigin(), PHP_URL_HOST);

        foreach ($children as $child) {
            if (parse_url($child, PHP_URL_HOST) !== $canonicalHost) {
                $problems[] = ['url' => $child, 'problem' => 'Sitemap URL is not on the canonical host.'];

                continue;
            }

            // Fetch through the audited origin so a staging audit does not hit production.
            $path = (string) parse_url($child, PHP_URL_PATH);
            $response = $this->get($baseUrl.$path);

            if (! $response instanceof Response || $response->status() !== 200) {
                $problems[] = ['url' => $baseUrl.$path, 'problem' => 'Child sitemap did not answer 200.'];
            }
        }

        return $problems;
    }

    /**
     * @return list<array{url: string, problem: string}>
     */
    private function checkTextEndpoints(string $baseUrl): array
    {
        $problems = [];

        $robots = $this->get("{$baseUrl}/robots.txt");

        if (! $robots instanceof Response || $robots->status() !== 200) {
            $problems[] = ['url' => "{$baseUrl}/robots.txt", 'problem' => 'robots.txt did not answer 200.'];
        }

        if ($this->llms->isAvailable()) {
            $llms = $this->get("{$baseUrl}/llms.txt");

            if (! $llms instanceof Response || $llms->status() !== 200) {
                $problems[] = ['url' => "{$baseUrl}/llms.txt", 'problem' => 'llms.txt did not answer 200.'];
            }
        }

        return $problems;
    }

    /**
     * Image URLs from JSON-LD plus the Open Graph / Twitter card tags.
     *
     * @return list<string>
     */
    private function imageUrlsIn(string $html): array
    {
        $urls = [];

        foreach ($this->validator->extract($html) as $block) {
            $document = json_decode($block, true);

            if (is_array($document)) {
                array_push($urls, ...$this->validator->imageUrls($document));
            }
        }

        preg_match_all('#<meta\s+(?:property|name)="(?:og:image|og:image:secure_url|twitter:image)"\s+content="([^"]*)"#i', $html, $matches);

        foreach ($matches[1] as $content) {
            $url = html_entity_decode($content);

            if (preg_match('#^https?://#i', $url) === 1) {
                $urls[] = $url;
            }
        }

        return array_values(array_unique($urls));
    }

    private function bodyContains(string $html, string $needle): bool
    {
        $withoutCode = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', '', $html) ?? $html;
        $text = html_entity_decode(strip_tags($withoutCode));

        return str_contains((string) preg_replace('/\s+/', ' ', $text), (string) preg_replace('/\s+/', ' ', $needle));
    }

    private function imageResolves(string $url): bool
    {
        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)->head($url);

            // Some image hosts reject HEAD; fall back to a GET before reporting a failure.
            if ($response->status() === 405 || $response->status() === 403) {
                $response = Http::timeout(self::TIMEOUT_SECONDS)->get($url);
            }

            return $response->status() === 200;
        } catch (ConnectionException) {
            return false;
        }
    }

    private function get(string $url): ?Response
    {
        try {
            return Http::timeout(self::TIMEOUT_SECONDS)
                ->withUserAgent('HalalBentaSeoAudit/1.0')
                ->get($url);
        } catch (ConnectionException) {
            return null;
        }
    }
}
