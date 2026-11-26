<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Counts a public post view (plan §9): never for bots, HEAD or prefetch requests, and at most once
 * per visitor session, post and day.
 *
 * The increment goes through the base query builder on purpose. It fires no model events (so the
 * blog cache observers do not clear the index on every read) and does not touch `updated_at` (so
 * the post's "Updated" date stays meaningful).
 */
final readonly class RecordBlogPostView
{
    /** Substrings that mark automated clients: search/AI crawlers, link unfurlers, monitors, HTTP libraries. */
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|scrape|fetch|preview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|embedly|whatsapp|curl\/|wget|python-|httpclient|go-http-client|java\/|libwww|axios|perplexity|ia_archiver/i';

    /**
     * @return bool whether this request was counted as a view
     */
    public function handle(BlogPost $post, Request $request): bool
    {
        if (! $this->isCountable($request)) {
            return false;
        }

        // Cache::add is atomic: only the first request for this key stores it and counts.
        $counted = Cache::add(
            $this->key($post, $request),
            1,
            now()->endOfDay(),
        );

        if (! $counted) {
            return false;
        }

        BlogPost::query()->whereKey($post->getKey())->toBase()->increment('view_count');

        return true;
    }

    private function isCountable(Request $request): bool
    {
        // HEAD and anything that is not a plain page load never counts.
        if (! $request->isMethod('GET')) {
            return false;
        }

        // Browser and Inertia link prefetching is not a read.
        $purpose = mb_strtolower($request->header('Sec-Purpose', $request->header('Purpose', '')));

        if (str_contains($purpose, 'prefetch') || str_contains($purpose, 'prerender') || $request->hasHeader('X-Moz')) {
            return false;
        }

        $userAgent = mb_trim((string) $request->userAgent());

        // Real browsers always send a user agent.
        return $userAgent !== '' && preg_match(self::BOT_PATTERN, $userAgent) !== 1;
    }

    private function key(BlogPost $post, Request $request): string
    {
        $visitor = $request->hasSession()
            ? $request->session()->getId()
            : sha1(($request->ip() ?? 'unknown').'|'.$request->userAgent());

        return 'blog:view:'.$post->getKey().':'.$visitor.':'.now()->toDateString();
    }
}
