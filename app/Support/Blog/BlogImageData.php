<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\BlogImage;
use Illuminate\Support\Facades\Storage;

/**
 * Public, presentation-ready view of a `blog_images` row: a main `src`, a `srcset` built from the
 * generated variants, intrinsic dimensions (so the browser reserves space) and alt text.
 */
final class BlogImageData
{
    /**
     * @param  'medium'|'large'  $main  variant used for `src` (falls back to the next best file)
     * @return array{src: string, srcset: string|null, width: int, height: int, alt: string}
     */
    public static function for(BlogImage $image, string $main = 'medium'): array
    {
        $disk = Storage::disk($image->disk);
        $variants = $image->variants;

        $sources = [];
        foreach (['thumb', 'medium', 'large'] as $name) {
            if (isset($variants[$name]['path'], $variants[$name]['width'])) {
                $sources[] = $disk->url($variants[$name]['path']).' '.(int) $variants[$name]['width'].'w';
            }
        }

        $order = $main === 'large' ? ['large', 'medium', 'thumb'] : ['medium', 'large', 'thumb'];
        $chosen = null;
        foreach ($order as $name) {
            if (isset($variants[$name]['path'])) {
                $chosen = $variants[$name];
                break;
            }
        }

        return [
            'src' => $disk->url($chosen['path'] ?? $image->original_path),
            'srcset' => $sources === [] ? null : implode(', ', $sources),
            'width' => (int) ($chosen['width'] ?? $image->width),
            'height' => (int) ($chosen['height'] ?? $image->height),
            'alt' => (string) $image->alt,
        ];
    }

    /**
     * Avatar rendition (the 256px square for avatar uploads), with the best available fallback.
     *
     * @return array{src: string, width: int, height: int}
     */
    public static function avatar(BlogImage $image): array
    {
        $disk = Storage::disk($image->disk);
        $variant = $image->variants['avatar'] ?? $image->variants['thumb'] ?? null;

        return [
            'src' => $disk->url($variant['path'] ?? $image->original_path),
            'width' => (int) ($variant['width'] ?? $image->width),
            'height' => (int) ($variant['height'] ?? $image->height),
        ];
    }

    /** Absolute URL of the 1200x630 Open Graph variant, when the post's cover has one. */
    public static function ogUrl(BlogImage $image): ?string
    {
        $path = $image->variants['og']['path'] ?? null;

        return $path === null ? null : Storage::disk($image->disk)->url($path);
    }
}
