<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class ReconcileMediaOrphansJob implements ShouldQueue
{
    use Queueable;

    /**
     * Every database column that references media.id.
     *
     * @var array<string, list<string>>
     */
    public const array REFERENCES = [
        'products' => ['video_media_id'],
    ];

    /**
     * Find orphaned media rows and delete them along with their S3 objects.
     */
    public function handle(): void
    {
        $gracePeriod = Carbon::now()->subDays(7);

        $orphans = Media::query()->where('created_at', '<', $gracePeriod);

        foreach (self::REFERENCES as $table => $columns) {
            foreach ($columns as $column) {
                $orphans->whereNotExists(function ($subquery) use ($table, $column): void {
                    $subquery->select(DB::raw(1))
                        ->from($table)
                        ->whereColumn("{$table}.{$column}", 'media.id');
                });
            }
        }

        $orphans
            ->chunk(100, function ($mediaRecords): void {
                foreach ($mediaRecords as $media) {
                    Storage::disk('s3')->delete($media->storage_path);
                    $media->delete();
                }
            });
    }
}
