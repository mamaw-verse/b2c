<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use Illuminate\Database\Events\TransactionRolledBack;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Throwable;

final readonly class SyncProductVideo
{
    /**
     * Store, replace, or remove a product's video.
     */
    public function handle(Product $product, ?UploadedFile $video, bool $remove, ?int $duration = null): void
    {
        $oldPath = $product->video_path;

        if ($remove) {
            $product->update([
                'video_path' => null,
                'video_duration' => null,
            ]);

            if ($oldPath !== null) {
                DB::afterCommit(static function () use ($oldPath): void {
                    Storage::disk('public')->delete($oldPath);
                });
            }

            return;
        }

        if ($video instanceof UploadedFile) {
            $newPath = $video->store('product-videos', 'public');

            if ($newPath === false) {
                return;
            }

            $state = new SyncVideoState;

            Event::listen(TransactionRolledBack::class, static function () use ($newPath, $state): void {
                if (! $state->committed) {
                    Storage::disk('public')->delete($newPath);
                }
            });

            DB::afterCommit(static function () use ($state, $oldPath): void {
                $state->committed = true;
                if ($oldPath !== null) {
                    Storage::disk('public')->delete($oldPath);
                }
            });

            try {
                $product->update([
                    'video_path' => $newPath,
                    'video_duration' => $duration,
                ]);
            } catch (Throwable $e) {
                Storage::disk('public')->delete($newPath);
                throw $e;
            }
        }
    }
}

final class SyncVideoState
{
    public bool $committed = false;
}
