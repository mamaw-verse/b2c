<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogImage;
use App\Models\User;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * The one path for cover, thumbnail, body and avatar images (docs/planning/15-blog.md §7.4).
 *
 * The file is decoded with GD and every output is re-encoded, which discards EXIF/GPS
 * metadata and any trailing or polyglot payload. No antivirus scan (decision §14).
 */
final readonly class StoreBlogImage
{
    private const ORIGINAL_MAX_SIDE = 2400;

    /** @var array<string, int> */
    private const WIDTHS = ['thumb' => 480, 'medium' => 960, 'large' => 1600];

    public function __construct(private ValidateBlogImageFile $validator)
    {
        //
    }

    /**
     * @throws ValidationException
     */
    public function handle(User $uploader, UploadedFile $file, string $purpose, ?string $alt = null, ?string $caption = null): BlogImage
    {
        if (! in_array($purpose, BlogImage::PURPOSES, true)) {
            throw ValidationException::withMessages(['purpose' => 'Unknown image purpose.']);
        }

        $problem = $this->validator->handle($file, $purpose, $alt);
        if ($problem !== null) {
            throw ValidationException::withMessages(['image' => $problem]);
        }

        $source = @imagecreatefromstring((string) file_get_contents((string) $file->getRealPath()));
        if (! $source instanceof GdImage) {
            throw ValidationException::withMessages(['image' => 'The file is not a valid image.']);
        }

        $source = $this->applyOrientation($source, (string) $file->getRealPath());
        $source = $this->flattenOnWhite($source);

        $disk = (string) config('blog.images.disk', 'public');
        $storage = Storage::disk($disk);
        $key = 'blog-images/'.now()->format('Y/m').'/'.Str::lower(Str::random(24));
        $ext = function_exists('imagewebp') ? 'webp' : 'jpg';

        $written = [];
        try {
            $original = $this->scaleToFit($source, self::ORIGINAL_MAX_SIDE);
            $originalPath = $key.'.jpg';
            $storage->put($originalPath, $this->encode($original, 'jpg'));
            $written[] = $originalPath;

            $variants = [];
            $put = function (string $name, GdImage $image, string $format) use ($storage, $key, &$written, &$variants): void {
                $path = $key.'-'.$name.'.'.$format;
                $storage->put($path, $this->encode($image, $format));
                $written[] = $path;
                $variants[$name] = ['path' => $path, 'width' => imagesx($image), 'height' => imagesy($image)];
            };

            if ($purpose === 'avatar') {
                $put('avatar', $this->coverCrop($source, 256, 256), $ext);
            } else {
                $width = imagesx($source);
                foreach (self::WIDTHS as $name => $target) {
                    if ($width >= $target) {
                        $put($name, $this->scaleToWidth($source, $target), $ext);
                    }
                }
                if ($variants === []) {
                    // Smaller than the smallest variant: keep one usable copy.
                    $put('thumb', $this->scaleToWidth($source, $width), $ext);
                }
                if ($purpose === 'cover') {
                    $put('og', $this->coverCrop($source, 1200, 630), 'jpg');
                }
            }

            return BlogImage::query()->create([
                'uploaded_by_id' => $uploader->getKey(),
                'purpose' => $purpose,
                'disk' => $disk,
                'original_path' => $originalPath,
                'variants' => $variants,
                'width' => imagesx($original),
                'height' => imagesy($original),
                'bytes' => (int) $file->getSize(),
                'mime' => (string) $file->getMimeType(),
                'alt' => $alt !== null && trim($alt) !== '' ? trim($alt) : null,
                'caption' => $caption !== null && trim($caption) !== '' ? trim($caption) : null,
            ]);
        } catch (Throwable $e) {
            $storage->delete($written);

            throw $e;
        }
    }

    /** Applies the EXIF orientation (when the exif extension exists) before metadata is dropped. */
    private function applyOrientation(GdImage $image, string $path): GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        $orientation = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;
        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $image;
        }

        $rotated = imagerotate($image, $angle, 0);

        return $rotated instanceof GdImage ? $rotated : $image;
    }

    /** JPEG output has no alpha: flatten transparent PNG/WebP onto white. */
    private function flattenOnWhite(GdImage $image): GdImage
    {
        $canvas = imagecreatetruecolor(imagesx($image), imagesy($image));
        imagefill($canvas, 0, 0, (int) imagecolorallocate($canvas, 255, 255, 255));
        imagecopy($canvas, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));

        return $canvas;
    }

    private function scaleToFit(GdImage $image, int $maxSide): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $longest = max($width, $height);

        if ($longest <= $maxSide) {
            return $image;
        }

        $ratio = $maxSide / $longest;

        return $this->resize($image, max(1, (int) round($width * $ratio)), max(1, (int) round($height * $ratio)));
    }

    private function scaleToWidth(GdImage $image, int $width): GdImage
    {
        $height = max(1, (int) round(imagesy($image) * ($width / imagesx($image))));

        return $this->resize($image, $width, $height);
    }

    private function resize(GdImage $image, int $width, int $height): GdImage
    {
        $out = imagecreatetruecolor($width, $height);
        imagecopyresampled($out, $image, 0, 0, 0, 0, $width, $height, imagesx($image), imagesy($image));

        return $out;
    }

    /** Scales to cover the box, then center-crops. */
    private function coverCrop(GdImage $image, int $width, int $height): GdImage
    {
        $srcW = imagesx($image);
        $srcH = imagesy($image);
        $scale = max($width / $srcW, $height / $srcH);
        $cropW = (int) round($width / $scale);
        $cropH = (int) round($height / $scale);
        $x = (int) floor(($srcW - $cropW) / 2);
        $y = (int) floor(($srcH - $cropH) / 2);

        $out = imagecreatetruecolor($width, $height);
        imagecopyresampled($out, $image, 0, 0, max(0, $x), max(0, $y), $width, $height, $cropW, $cropH);

        return $out;
    }

    private function encode(GdImage $image, string $format): string
    {
        ob_start();
        $format === 'webp' ? imagewebp($image, null, 82) : imagejpeg($image, null, 85);

        return (string) ob_get_clean();
    }
}
