<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\BlogImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes blog images nothing references, once they are older than `blog.images.orphan_days`.
 * Age is measured from upload (as in `ReconcileMediaOrphansJob`), so an image that was used
 * and later released is removed on the next run after the grace period has passed.
 */
final class ReconcileBlogImageOrphansJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        BlogImage::query()
            ->where('created_at', '<', now()->subDays((int) config('blog.images.orphan_days', 7)))
            ->unreferenced()
            ->chunkById(100, function ($images): void {
                foreach ($images as $image) {
                    Storage::disk($image->disk)->delete($image->storedPaths());
                    $image->delete();
                }
            });
    }
}
