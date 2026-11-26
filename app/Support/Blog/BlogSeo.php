<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Support\SeoData;

/**
 * Small helpers shared by the blog SEO builders. Phase 3 (B3.1) layers `BlogPosting` / `Person`
 * JSON-LD and the validator rules on top of these basics.
 */
final class BlogSeo
{
    public static function url(string $path = '', int $page = 1): string
    {
        $url = SeoData::canonicalOrigin().'/blog'.($path === '' ? '' : '/'.mb_ltrim($path, '/'));

        return $page > 1 ? "{$url}?page={$page}" : $url;
    }

    public static function robots(bool $indexable): string
    {
        return SeoData::isStaging() || ! $indexable ? 'noindex, follow' : SeoData::INDEXABLE_ROBOTS;
    }

    public static function title(string $head): string
    {
        return $head.' | '.config()->string('blog.title', 'HalalBenta Blog');
    }

    /**
     * Canonical, prev/next and "beyond the last page" for a paginated listing.
     *
     * @param  array{current_page: int, last_page: int, total: int}  $meta
     * @return array{canonical: string, prev: string|null, next: string|null, beyond_last: bool, suffix: string}
     */
    public static function paging(string $path, array $meta): array
    {
        $page = $meta['current_page'];
        $last = max(1, $meta['last_page']);

        return [
            'canonical' => self::url($path, min($page, $last)),
            'prev' => $page > 1 ? self::url($path, min($page - 1, $last)) : null,
            'next' => $page < $last ? self::url($path, $page + 1) : null,
            'beyond_last' => $page > $last,
            'suffix' => $page > 1 ? " – Page {$page}" : '',
        ];
    }

    /**
     * @param  array{url: string, width: int, height: int, alt: string, type: string}|null  $image
     * @param  array{published_time?: string, modified_time?: string, section?: string, author?: string, tags?: list<string>}|null  $article
     * @param  array<string, mixed>  $jsonLd
     * @param  list<array{label: string, data: string}>  $twitterLabels
     */
    public static function make(
        string $title,
        string $description,
        string $canonical,
        string $robots,
        ?array $image = null,
        ?array $article = null,
        array $jsonLd = [],
        ?string $prev = null,
        ?string $next = null,
        ?string $author = null,
        array $twitterLabels = [],
    ): SeoData {
        $image ??= [
            'url' => SeoData::defaultOgImage(),
            'width' => 1200,
            'height' => 630,
            'alt' => 'HalalBenta Blog',
            'type' => 'image/jpeg',
        ];

        $og = [
            'site_name' => 'HalalBenta',
            'locale' => 'en_PH',
            'type' => $article === null ? 'website' : 'article',
            'title' => $title,
            'description' => $description,
            'url' => $canonical,
            'image' => $image['url'],
            'image_width' => $image['width'],
            'image_height' => $image['height'],
            'image_alt' => $image['alt'],
            'image_type' => $image['type'],
        ];
        if ($article !== null) {
            $og['article'] = $article;
        }

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: $robots,
            og: $og,
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $image['url'],
                'image_alt' => $image['alt'],
                ...($twitterLabels === [] ? [] : ['labels' => $twitterLabels]),
            ],
            jsonLd: $jsonLd,
            prev: $prev,
            next: $next,
            author: $author,
        );
    }
}
