<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Carbon;
use Throwable;

/**
 * Published / modified dates for an editorial content page (docs/planning/14 T4.5).
 *
 * Content pages live in config, so there is no database timestamp. Dates come only from
 * `marketplace.pages.{key}.published` / `.updated`; when unset nothing is emitted and no "Last
 * updated" line is shown. The same normalized value feeds the visible date, JSON-LD and
 * `article:*` tags so they cannot disagree.
 */
final readonly class ContentPageDates
{
    /**
     * @param  array<string, mixed>  $pageData
     * @return array{published: string|null, modified: string|null} Dates as `Y-m-d`.
     */
    public static function for(array $pageData): array
    {
        $published = self::parse($pageData['published'] ?? null);
        $modified = self::parse($pageData['updated'] ?? null);

        // A modification date before publication is a config mistake: do not publish it.
        if ($published !== null && $modified !== null && $modified < $published) {
            $modified = null;
        }

        return ['published' => $published, 'modified' => $modified];
    }

    private static function parse(mixed $value): ?string
    {
        if (! is_string($value) || mb_trim($value) === '') {
            return null;
        }

        try {
            $date = Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }

        // Never advertise a date in the future.
        return $date->isFuture() ? null : $date->format('Y-m-d');
    }
}
