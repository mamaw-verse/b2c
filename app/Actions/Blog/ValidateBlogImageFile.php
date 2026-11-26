<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use finfo;
use Illuminate\Http\UploadedFile;

/**
 * Content-based checks for a blog image upload (docs/planning/15-blog.md §7.4).
 * Returns the first problem as a message, or null when the file is acceptable.
 * Reads headers only, so an oversized image is refused before it is decoded.
 */
final readonly class ValidateBlogImageFile
{
    public const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    /** @var array<string, array{0: int, 1: int}> */
    private const MINIMUMS = [
        'cover' => [1200, 630],
        'thumbnail' => [480, 270],
        'avatar' => [256, 256],
    ];

    public function handle(UploadedFile $file, string $purpose, ?string $alt): ?string
    {
        $path = $file->getRealPath();
        if ($path === false || ! is_file($path)) {
            return 'The upload could not be read.';
        }

        if (in_array($purpose, ['cover', 'body'], true) && mb_trim((string) $alt) === '') {
            return 'Alt text is required for cover and body images.';
        }

        $maxBytes = (int) config('blog.images.max_kb') * 1024;
        if (($file->getSize() ?: 0) > $maxBytes) {
            return 'The image is larger than '.(int) config('blog.images.max_kb').' KB.';
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: '';
        if (! in_array($mime, self::MIMES, true)) {
            return 'Only JPEG, PNG and WebP images are accepted.';
        }

        $info = @getimagesize($path);
        if ($info === false || $info[0] < 1 || $info[1] < 1) {
            return 'The file is not a valid image.';
        }

        [$width, $height] = $info;

        if (max($width, $height) > (int) config('blog.images.max_dimension')) {
            return 'The longest side must be at most '.(int) config('blog.images.max_dimension').' px.';
        }

        if ($width * $height > (int) config('blog.images.max_pixels')) {
            return 'The image has too many pixels (limit 25 megapixels).';
        }

        if ($this->isAnimated($path, $mime)) {
            return 'Animated images are not accepted.';
        }

        if (isset(self::MINIMUMS[$purpose])) {
            [$minWidth, $minHeight] = self::MINIMUMS[$purpose];
            if ($width < $minWidth || $height < $minHeight) {
                return "A {$purpose} image must be at least {$minWidth}x{$minHeight} px.";
            }
        }

        return null;
    }

    private function isAnimated(string $path, string $mime): bool
    {
        $head = (string) file_get_contents($path, false, null, 0, 8192);

        if ($mime === 'image/png') {
            // APNG: an acTL chunk precedes the first IDAT.
            $idat = mb_strpos($head, 'IDAT', 0, '8bit');
            $actl = mb_strpos($head, 'acTL', 0, '8bit');

            return $actl !== false && ($idat === false || $actl < $idat);
        }

        if ($mime === 'image/webp') {
            // Extended header (VP8X) with the animation flag, or any ANIM chunk.
            if (mb_substr($head, 12, 4, '8bit') === 'VP8X' && mb_strlen($head, '8bit') > 20 && (ord($head[20]) & 0x02) !== 0) {
                return true;
            }

            return str_contains($head, 'ANIM');
        }

        return false;
    }
}
