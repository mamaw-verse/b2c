<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\Product;

/**
 * Splits a post's stored `body_html` on the `[[product:slug]]` marker elements that
 * `RenderBlogBody` emits and fills each one with live card data (plan §7.2).
 *
 * The result is a list of `{type: 'html', html}` and `{type: 'product', product}` segments.
 * Products are resolved in one batched query with the catalogue's public visibility rules
 * (`Product::visible()`, plus not moderated-hidden), so a stale embed (unpublished, hidden,
 * or no longer visible to buyers) is skipped silently instead of breaking the page.
 */
final class BlogSegments
{
    /** Matches the exact marker `RenderBlogBody` writes; the slug shape is validated there too. */
    private const MARKER = '#<div data-blog-product="([a-z0-9]+(?:-[a-z0-9]+)*)"></div>\n?#';

    /**
     * @return list<array{type: 'html', html: string}|array{type: 'product', product: array<string, mixed>}>
     */
    public function handle(string $html): array
    {
        if ($html === '') {
            return [];
        }

        $parts = preg_split(self::MARKER, $html, -1, PREG_SPLIT_DELIM_CAPTURE);

        // preg_split only returns false on a PCRE error; fall back to the plain body.
        if ($parts === false || count($parts) === 1) {
            return [['type' => 'html', 'html' => $html]];
        }

        // With DELIM_CAPTURE the parts alternate: html, slug, html, slug, ..., html.
        $slugs = [];

        foreach ($parts as $index => $part) {
            if ($index % 2 === 1) {
                $slugs[] = $part;
            }
        }

        $products = $this->products(array_values(array_unique($slugs)));

        $segments = [];

        foreach ($parts as $index => $part) {
            if ($index % 2 === 0) {
                if (trim($part) !== '') {
                    $segments[] = ['type' => 'html', 'html' => $part];
                }

                continue;
            }

            if (isset($products[$part])) {
                $segments[] = ['type' => 'product', 'product' => $products[$part]];
            }
        }

        return $segments;
    }

    /**
     * @param  list<string>  $slugs
     * @return array<string, array<string, mixed>> card data keyed by slug
     */
    private function products(array $slugs): array
    {
        if ($slugs === []) {
            return [];
        }

        return Product::visible()
            ->where('hidden', false)
            ->whereIn('slug', $slugs)
            ->with(['halalCertification', 'images', 'category'])
            ->get()
            ->mapWithKeys(fn (Product $product): array => [$product->slug => $product->toCard()])
            ->all();
    }
}
