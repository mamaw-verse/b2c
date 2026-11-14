<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use App\Services\MediaUploadService;
use Illuminate\Database\Events\TransactionRolledBack;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Throwable;

final readonly class SyncProductVideo
{
    public function __construct(
        private MediaUploadService $mediaUploadService,
    ) {}

    /**
     * Store, replace, or remove a product's video.
     */
    public function handle(Product $product, ?UploadedFile $video, bool $remove, ?int $duration = null): void
    {
        $oldPath = $product->video_path;
        $oldMedia = $product->video;

        if ($remove) {
            $product->update([
                'video_media_id' => null,
                'video_path' => null,
                'video_duration' => null,
            ]);

            if ($oldMedia !== null) {
                DB::afterCommit(static function () use ($oldMedia): void {
                    Storage::disk('s3')->delete($oldMedia->storage_path);
                    $oldMedia->delete();
                });
            }

            if ($oldPath !== null) {
                DB::afterCommit(static function () use ($oldPath): void {
                    Storage::disk('public')->delete($oldPath);
                });
            }

            return;
        }

        if ($video instanceof UploadedFile) {
            $uploaderId = (string) (auth()->id() ?? $product->shop->user_id);
            $media = $this->mediaUploadService->storeVideo($video, $uploaderId, 'Product video');

            $state = new SyncVideoState;

            Event::listen(TransactionRolledBack::class, static function () use ($media, $state): void {
                if (! $state->committed) {
                    Storage::disk('s3')->delete($media->storage_path);
                    $media->delete();
                }
            });

            DB::afterCommit(static function () use ($state, $oldMedia, $oldPath): void {
                $state->committed = true;
                if ($oldMedia !== null) {
                    Storage::disk('s3')->delete($oldMedia->storage_path);
                    $oldMedia->delete();
                }
                if ($oldPath !== null) {
                    Storage::disk('public')->delete($oldPath);
                }
            });

            try {
                $product->update([
                    'video_media_id' => $media->id,
                    'video_path' => null,
                    'video_duration' => $duration,
                ]);
            } catch (Throwable $e) {
                Storage::disk('s3')->delete($media->storage_path);
                $media->delete();
                throw $e;
            }
        }
    }
}

final class SyncVideoState
{
    public bool $committed = false;
}
