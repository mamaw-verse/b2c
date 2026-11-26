<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Support\TrustFacts;

/**
 * `[[fact:key]]` tokens (docs/planning/15-blog.md B4.5, editorial rule §4.6 #4).
 *
 * Delivery, escrow, return and payment statements in an article must come from the same
 * values the rest of the site uses (`TrustFacts`, which reads `config/marketplace.php`), so a
 * post can never say "7 days" while the policy says 14. The stored `body_html` keeps the token
 * as plain text and it is resolved on every render, which means a policy change updates every
 * article at once with no re-save.
 *
 * A fact is only available while its setting backs it (no returns window, no halal-verification
 * claim, no couriers configured → no value). `RenderBlogBody` turns an unknown or unavailable
 * token into a blocking error; if a fact becomes unavailable after a post is published, the token
 * resolves to nothing rather than to a stale claim.
 */
final class BlogFacts
{
    /** Strict token shape. The renderer also scans a looser shape to report malformed tokens. */
    public const string TOKEN = '/\[\[fact:([a-z][a-z0-9_]*)\]\]/';

    /** Looser shape: anything that starts like a fact token, so typos are reported. */
    public const string LOOSE_TOKEN = '/\[\[fact:([^\]]*)\]\]/';

    /** Statement facts exposed from `TrustFacts::statements()` (the sentence, ending in a full stop). */
    private const array STATEMENTS = ['escrow', 'returns', 'auto_confirm', 'coverage', 'seller_approval', 'halal_verification'];

    /** Value facts (a phrase meant to sit inside a sentence, no trailing full stop). */
    private const array VALUES = ['return_window', 'auto_confirm_window', 'courier_list', 'payment_list'];

    /**
     * Every key an author may use, for the admin help text and the "unknown fact" error.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return [...self::VALUES, ...self::STATEMENTS];
    }

    public static function isKnown(string $key): bool
    {
        return in_array($key, self::keys(), true);
    }

    /**
     * The current text for a fact, or null when the key is unknown or its setting does not back it.
     */
    public static function value(string $key): ?string
    {
        if (in_array($key, self::STATEMENTS, true)) {
            foreach (TrustFacts::statements() as $statement) {
                if ($statement['key'] === $key) {
                    return $statement['text'];
                }
            }

            return null;
        }

        return match ($key) {
            'return_window' => self::days(TrustFacts::returnWindowDays()),
            'auto_confirm_window' => self::days((int) config('marketplace.auto_confirm_days', 0)),
            'courier_list' => self::list(config()->array('marketplace.couriers', [])),
            'payment_list' => self::list(config()->array('marketplace.payments', [])),
            default => null,
        };
    }

    /**
     * Keys used by `[[fact:…]]` tokens in a piece of plain text, in order, with duplicates kept out.
     * Anything that looks like a token but is not a valid key is returned as-is so the caller can report it.
     *
     * @return list<string>
     */
    public static function tokensIn(string $text): array
    {
        if (preg_match_all(self::LOOSE_TOKEN, $text, $matches) === 0) {
            return [];
        }

        return array_values(array_unique($matches[1]));
    }

    /**
     * Replaces every token in rendered post HTML with its current, HTML-escaped value (or nothing
     * when the fact is unavailable). Tokens inside `<code>` and `<pre>` are left as written so a
     * post can document the syntax.
     */
    public static function resolve(string $html): string
    {
        if (! str_contains($html, '[[fact:')) {
            return $html;
        }

        $parts = preg_split('#(<pre\b.*?</pre>|<code\b.*?</code>)#si', $html, -1, PREG_SPLIT_DELIM_CAPTURE);

        if ($parts === false) {
            return $html;
        }

        foreach ($parts as $index => $part) {
            // With DELIM_CAPTURE the odd entries are the protected code blocks.
            if ($index % 2 === 1) {
                continue;
            }

            $parts[$index] = (string) preg_replace_callback(
                self::TOKEN,
                static fn (array $match): string => e(self::value($match[1]) ?? ''),
                $part,
            );
        }

        return implode('', $parts);
    }

    private static function days(int $days): ?string
    {
        return $days > 0 ? $days.' '.($days === 1 ? 'day' : 'days') : null;
    }

    /**
     * @param  array<array-key, mixed>  $items
     */
    private static function list(array $items): ?string
    {
        $items = array_values(array_filter(array_map(static fn (mixed $item): string => mb_trim((string) $item), $items), static fn (string $item): bool => $item !== ''));

        return $items === [] ? null : implode(', ', $items);
    }
}
