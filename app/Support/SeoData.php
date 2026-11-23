<?php

declare(strict_types=1);

namespace App\Support;

use App\Actions\Seo\Schema\BuildOrganizationNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Actions\Seo\Schema\BuildWebSiteNode;
use App\Support\Schema\SchemaGraph;
use Illuminate\Support\Str;

final readonly class SeoData
{
    /** Robots value for indexable pages: allows large previews and unrestricted snippets for search and AI answer engines. */
    public const string INDEXABLE_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    /**
     * @param  array{
     *     type: string,
     *     updated_time?: string,
     *     article?: array{published_time?: string, modified_time?: string, section?: string, author?: string},
     *     title: string,
     *     description: string,
     *     url: string,
     *     image: string,
     *     image_width: int,
     *     image_height: int,
     *     image_alt: string,
     *     image_type: string,
     *     site_name: string,
     *     locale: string
     * }  $og
     * @param  array{
     *     card: string,
     *     title: string,
     *     description: string,
     *     image: string,
     *     image_alt: string,
     *     site?: string,
     *     labels?: array<int, array{label: string, data: string}>
     * }  $twitter
     * @param  array{
     *     price_amount: string,
     *     price_currency: string,
     *     availability: string,
     *     condition: string,
     *     retailer_item_id: string,
     *     brand: string,
     *     category?: string,
     *     sale_price_amount?: string
     * }|null  $product
     * @param  array<string, mixed>  $jsonLd
     */
    public function __construct(
        public string $title,
        public string $description,
        public string $canonical,
        public string $robots,
        public array $og,
        public array $twitter,
        public ?array $product = null,
        public array $jsonLd = [],
        public ?string $prev = null,
        public ?string $next = null,
    ) {}

    public static function canonicalOrigin(): string
    {
        return mb_rtrim((string) config('app.url', 'https://halalbenta.com'), '/');
    }

    /**
     * Absolute URL for a root-relative path or an already-absolute URL.
     */
    public static function absoluteUrl(string $pathOrUrl): string
    {
        if (Str::startsWith($pathOrUrl, ['http://', 'https://'])) {
            return $pathOrUrl;
        }

        return self::canonicalOrigin().'/'.mb_ltrim($pathOrUrl, '/');
    }

    /**
     * Canonical Organization logo (square PNG), configured in config/seo.php.
     */
    public static function logoUrl(): string
    {
        return self::absoluteUrl((string) config('seo.logo_path', '/brand/halalbenta-icon-512.png'));
    }

    public static function defaultOgImage(): string
    {
        return self::absoluteUrl((string) config('seo.default_og_image', '/social/default-og.jpg'));
    }

    /**
     * Generate an absolute, canonical URL without tracking parameters.
     */
    public static function buildCanonical(string $path = '/', array $params = []): string
    {
        $origin = self::canonicalOrigin();
        $cleanPath = '/'.mb_ltrim($path, '/');
        if ($cleanPath !== '/') {
            $cleanPath = mb_rtrim($cleanPath, '/');
        }

        // Keep only non-tracking allowed parameters (e.g. page)
        $allowed = [];
        foreach ($params as $key => $val) {
            $k = (string) $key;
            if (str_starts_with($k, 'utm_') || in_array($k, ['fbclid', 'gclid', 'ref', 'variant'], true)) {
                continue;
            }
            if ($k === 'page' && ((int) $val <= 1)) {
                continue;
            }
            $allowed[$k] = (string) $val;
        }

        $query = ! empty($allowed) ? '?'.http_build_query($allowed) : '';

        return $origin.$cleanPath.$query;
    }

    public static function isStaging(): bool
    {
        $url = (string) config('app.url', '');
        $env = (string) config('app.env', 'production');

        return $env === 'staging'
            || str_contains($url, 'oneinsurance')
            || (bool) config('seo.force_noindex', false);
    }

    public static function isPrivatePath(string $path): bool
    {
        $path = mb_trim($path, '/');

        if (in_array($path, config()->array('seo.public_path_exceptions', []), true)) {
            return false;
        }

        foreach (config()->array('seo.private_path_patterns', []) as $pattern) {
            if (Str::is((string) $pattern, $path) || Str::is((string) $pattern, $path.'/')) {
                return true;
            }
        }

        return false;
    }

    public static function isNoindexFollowPath(string $path): bool
    {
        return in_array(mb_trim($path, '/'), config()->array('seo.noindex_follow_paths', []), true);
    }

    public static function defaultRobots(string $path = '/'): string
    {
        if (self::isStaging()) {
            return 'noindex, nofollow';
        }

        if (self::isPrivatePath($path)) {
            return 'noindex, nofollow';
        }

        if (self::isNoindexFollowPath($path)) {
            return 'noindex, follow';
        }

        return self::INDEXABLE_ROBOTS;
    }

    public static function fallback(?string $path = null): self
    {
        $currentPath = $path ?? (request()?->path() ? '/'.request()->path() : '/');
        $canonical = self::buildCanonical($currentPath);
        $robots = self::defaultRobots($currentPath);
        $defaultImage = self::defaultOgImage();

        $title = 'HalalBenta – Verified Halal Marketplace in the Philippines';
        $description = 'Shop verified halal food, meat & seafood, dates & sweets, modest fashion, prayer essentials and more. Escrow-protected checkout, delivered across the Philippines.';

        return new self(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: $robots,
            og: [
                'type' => 'website',
                'title' => $title,
                'description' => $description,
                'url' => $canonical,
                'image' => $defaultImage,
                'image_width' => 1200,
                'image_height' => 630,
                'image_alt' => 'HalalBenta Marketplace',
                'image_type' => 'image/jpeg',
                'site_name' => 'HalalBenta',
                'locale' => 'en_PH',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $defaultImage,
                'image_alt' => 'HalalBenta Marketplace',
            ],
            product: null,
            jsonLd: SchemaGraph::make()
                ->add(resolve(BuildOrganizationNode::class)->handle())
                ->add(resolve(BuildWebSiteNode::class)->handle())
                ->add(resolve(BuildWebPageNode::class)->handle(
                    type: 'WebPage',
                    url: $canonical,
                    name: $title,
                    description: $description,
                ))
                ->toArray(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'canonical' => $this->canonical,
            'robots' => $this->robots,
            'og' => $this->og,
            'twitter' => $this->twitter,
            'product' => $this->product,
            'jsonLd' => $this->jsonLd,
            'prev' => $this->prev,
            'next' => $this->next,
        ];
    }
}
