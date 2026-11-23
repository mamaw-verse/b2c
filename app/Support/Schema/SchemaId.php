<?php

declare(strict_types=1);

namespace App\Support\Schema;

use App\Support\SeoData;

/**
 * Stable JSON-LD `@id` values so entities link across nodes and pages.
 *
 * Fragment convention: `{canonical-url}#{role}` (e.g. `/products/dates#product`).
 */
final class SchemaId
{
    public static function organization(): string
    {
        return SeoData::canonicalOrigin().'/#organization';
    }

    public static function website(): string
    {
        return SeoData::canonicalOrigin().'/#website';
    }

    public static function shop(string $slug): string
    {
        return SeoData::canonicalOrigin()."/shops/{$slug}#store";
    }

    public static function product(string $slug): string
    {
        return SeoData::canonicalOrigin()."/products/{$slug}#product";
    }

    public static function webPage(string $url): string
    {
        return self::withFragment($url, 'webpage');
    }

    public static function breadcrumb(string $url): string
    {
        return self::withFragment($url, 'breadcrumb');
    }

    public static function faq(string $url): string
    {
        return self::withFragment($url, 'faq');
    }

    public static function itemList(string $url): string
    {
        return self::withFragment($url, 'itemlist');
    }

    private static function withFragment(string $url, string $fragment): string
    {
        $base = explode('#', $url, 2)[0];

        return "{$base}#{$fragment}";
    }
}
