<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\BlogImage;
use Illuminate\Support\Facades\Storage;

/** JSON shape the editor's image dialog and library work with. */
final class BlogImagePayload
{
    /**
     * @return array<string, mixed>
     */
    public static function from(BlogImage $image): array
    {
        $disk = Storage::disk($image->disk);
        $preview = $image->variants['thumb'] ?? $image->variants['avatar'] ?? $image->variants['medium'] ?? null;

        return [
            'id' => $image->id,
            'purpose' => $image->purpose,
            'alt' => $image->alt,
            'caption' => $image->caption,
            'width' => $image->width,
            'height' => $image->height,
            'preview_url' => $preview !== null ? $disk->url($preview['path']) : $disk->url($image->original_path),
            'markdown' => '!['.str_replace(['[', ']'], '', (string) $image->alt).'](blog-image:'.$image->id.')',
            'used_by' => $image->getAttribute('posts_count'),
        ];
    }
}
