<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final readonly class DeleteSellerProduct
{
    public function handle(Product $product): bool
    {
        $videoPath = $product->video_path;
        $imagePaths = $product->images()
            ->get()
            ->map(static function ($img): ?string {
                if (! empty($img->url) && str_contains($img->url, 'product-images/')) {
                    return 'product-images/'.Str::after($img->url, 'product-images/');
                }

                return null;
            })
            ->filter()
            ->values()
            ->all();

        return DB::transaction(function () use ($product, $videoPath, $imagePaths) {
            $product->variations()->delete();
            $product->images()->delete();
            $product->halalCertifications()->delete();

            $deleted = (bool) $product->delete();

            DB::afterCommit(static function () use ($videoPath, $imagePaths): void {
                if ($videoPath !== null) {
                    Storage::disk('public')->delete($videoPath);
                }

                if (! empty($imagePaths)) {
                    Storage::disk('public')->delete($imagePaths);
                }
            });

            return $deleted;
        });
    }
}
