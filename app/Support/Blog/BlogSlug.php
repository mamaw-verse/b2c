<?php

declare(strict_types=1);

namespace App\Support\Blog;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Slug helpers shared by posts, authors and categories (docs/planning/15-blog.md §4.2).
 */
final class BlogSlug
{
    public const FORMAT = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public static function isReserved(string $slug): bool
    {
        return in_array($slug, (array) config('blog.reserved_slugs', []), true);
    }

    /**
     * A slug from `$text` that is not reserved and not used in `$table.$column`
     * (nor, when given, in the extra table), suffixing `-2`, `-3`, … as needed.
     *
     * @param  list<array{0: string, 1: string}>  $alsoTaken  extra [table, column] pairs that must be free too
     */
    public static function unique(string $text, string $table, string $column = 'slug', ?string $ignoreId = null, array $alsoTaken = [], string $fallback = 'post'): string
    {
        $base = Str::slug($text);
        $base = $base === '' ? $fallback : Str::limit($base, 150, '');

        $slug = $base;
        for ($n = 2; self::isReserved($slug) || self::taken($slug, $table, $column, $ignoreId, $alsoTaken); $n++) {
            $slug = "{$base}-{$n}";
        }

        return $slug;
    }

    /**
     * @param  list<array{0: string, 1: string}>  $alsoTaken
     */
    public static function taken(string $slug, string $table, string $column = 'slug', ?string $ignoreId = null, array $alsoTaken = []): bool
    {
        $query = DB::table($table)->where($column, $slug);
        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }
        if ($query->exists()) {
            return true;
        }

        foreach ($alsoTaken as [$otherTable, $otherColumn]) {
            if (DB::table($otherTable)->where($otherColumn, $slug)->exists()) {
                return true;
            }
        }

        return false;
    }
}
