<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Str;

final readonly class SeoData
{
    /**
     * @param  array{
     *     type: string,
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
     *     labels?: array<int, array{label: string, data: string}>
     * }  $twitter
     * @param  array{
     *     price_amount: string,
     *     price_currency: string,
     *     availability: string,
     *     condition: string,
     *     retailer_item_id: string,
     *     brand: string
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
        if ($path === 'seller/terms') {
            return false;
        }

        $patterns = [
            'cart*',
            'checkout*',
            'order-confirmed*',
            'account*',
            'login',
            'register',
            'forgot-password',
            'reset-password*',
            'two-factor*',
            'password*',
            'confirm-password',
            'verify-email*',
            'seller/*',
            'admin*',
            'api*',
            'orders*',
            'reports*',
            'staff-invitations*',
        ];

        foreach ($patterns as $pattern) {
            if (Str::is($pattern, $path)) {
                return true;
            }
        }

        return false;
    }

    public static function defaultRobots(string $path = '/'): string
    {
        if (self::isStaging()) {
            return 'noindex, nofollow';
        }

        if (self::isPrivatePath($path)) {
            return 'noindex, nofollow';
        }

        $cleanPath = mb_trim($path, '/');
        if ($cleanPath === 'search') {
            return 'noindex, follow';
        }

        return 'index, follow, max-image-preview:large';
    }

    public static function fallback(?string $path = null): self
    {
        $currentPath = $path ?? (request()?->path() ? '/'.request()->path() : '/');
        $canonical = self::buildCanonical($currentPath);
        $robots = self::defaultRobots($currentPath);
        $origin = self::canonicalOrigin();
        $defaultImage = $origin.'/social/default-og.jpg';

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
            jsonLd: [
                '@context' => 'https://schema.org',
                '@graph' => [
                    [
                        '@type' => 'Organization',
                        'name' => 'HalalBenta',
                        'url' => $origin,
                        'logo' => $origin.'/brand/halalbenta-icon-512.png',
                    ],
                    [
                        '@type' => 'WebSite',
                        'name' => 'HalalBenta',
                        'url' => $origin,
                        'potentialAction' => [
                            '@type' => 'SearchAction',
                            'target' => $origin.'/search?q={search_term_string}',
                            'query-input' => 'required name=search_term_string',
                        ],
                    ],
                ],
            ],
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
