<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

/**
 * Drops per-day view rows older than `blog.daily_views_keep_days` (never less than the popularity
 * window). The all-time total lives on `blog_posts.view_count` and is untouched.
 */
final class PruneBlogDailyViewsJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $keep = max(
            config()->integer('blog.popular_window_days', 30),
            config()->integer('blog.daily_views_keep_days', 90),
        );

        DB::table('blog_post_daily_views')
            ->where('day', '<', now()->subDays($keep)->toDateString())
            ->delete();
    }
}
