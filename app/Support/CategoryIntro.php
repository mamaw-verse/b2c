<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Category;

/**
 * Short visible intro paragraph for a category page (docs/planning/14 T4.6), so each
 * category has unique, indexable body text instead of only a meta description.
 *
 * Hand-written copy in `config('seo.category_intros.{slug}')` wins. Otherwise the intro is built
 * only from real data: product count, real subcategory names and TrustFacts. It makes no claim
 * about specific products, regions or delivery times.
 */
final readonly class CategoryIntro
{
    private const int MAX_SUBCATEGORIES = 6;

    /**
     * @param  int  $total  Count of visible products in the category without filters applied.
     */
    public static function for(Category $category, int $total): string
    {
        $override = config("seo.category_intros.{$category->slug}");
        if (is_string($override) && mb_trim($override) !== '') {
            return mb_trim($override);
        }

        $name = (string) config('seo.site_name', 'HalalBenta');

        if ($total === 0) {
            return "There are no {$category->name} products on {$name} right now. Check back soon, or browse the other categories.";
        }

        $parts = ["Browse {$total} ".($total === 1 ? 'product' : 'products')." in {$category->name} from independent sellers on {$name}, delivered across the Philippines."];

        /** @var list<string> $children */
        $children = $category->relationLoaded('children')
            ? $category->children->pluck('name')->take(self::MAX_SUBCATEGORIES)->values()->all()
            : [];

        if ($children !== []) {
            $parts[] = 'Narrow it down by '.self::joinList($children).'.';
        }

        $parts[] = 'Checkout is escrow-protected. '.TrustFacts::returnWindowPhrase().'.';

        return implode(' ', $parts);
    }

    /**
     * @param  list<string>  $items
     */
    private static function joinList(array $items): string
    {
        $items = array_map('strval', $items);

        if (count($items) === 1) {
            return $items[0];
        }

        $last = array_pop($items);

        return implode(', ', $items).' or '.$last;
    }
}
