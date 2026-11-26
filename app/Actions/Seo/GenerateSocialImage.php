<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Enums\HalalStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use GdImage;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Throwable;

final readonly class GenerateSocialImage
{
    private const int WIDTH = 1200;

    private const int HEIGHT = 630;

    private const int JPEG_QUALITY = 82;

    public function handle(string $type, string $slug, ?string $version = null): string
    {
        $fallbackPath = public_path('social/default-og.jpg');
        if (! file_exists($fallbackPath)) {
            $fallbackPath = public_path('brand/og-image.png');
        }

        $versionStr = $version ?: 'default';
        $storageDir = storage_path('app/public/social');
        if (! is_dir($storageDir)) {
            File::makeDirectory($storageDir, 0755, true, true);
        }

        $cacheFile = $storageDir."/{$type}_{$slug}_{$versionStr}.jpg";
        if (file_exists($cacheFile) && filesize($cacheFile) > 0) {
            return $cacheFile;
        }

        try {
            $cardData = match ($type) {
                'product' => $this->getProductData($slug),
                'shop' => $this->getShopData($slug),
                'category' => $this->getCategoryData($slug),
                default => null,
            };

            if ($cardData === null) {
                return $fallbackPath;
            }

            $generated = $this->renderCard($cardData, $cacheFile);

            return $generated ? $cacheFile : $fallbackPath;
        } catch (Throwable $e) {
            report($e);

            return $fallbackPath;
        }
    }

    /**
     * @return array{
     *     title: string,
     *     subtitle: string,
     *     price?: string,
     *     badge: string,
     *     source_image?: string|null
     * }|null
     */
    private function getProductData(string $slug): ?array
    {
        $product = Product::where('slug', $slug)->with(['shop', 'images'])->first();
        if ($product === null) {
            return null;
        }

        $price = '₱'.number_format($product->price / 100, $product->price % 100 === 0 ? 0 : 2);
        $shopName = $product->shop->name ?? 'HalalBenta Seller';
        $city = $product->shop->city ?? $product->location;
        $subtitle = 'Sold by '.$shopName.($city ? ' in '.$city : '');

        $badge = match ($product->halal_status) {
            HalalStatus::Certified, HalalStatus::Expiring => 'Halal Certified',
            HalalStatus::NotApplicable => 'Muslim-Friendly',
            default => 'Verified Halal',
        };

        $image = $product->thumbnailUrl();

        return [
            'title' => $product->name,
            'subtitle' => $subtitle,
            'price' => $price,
            'badge' => $badge,
            'source_image' => $image,
        ];
    }

    /**
     * @return array{
     *     title: string,
     *     subtitle: string,
     *     price?: string,
     *     badge: string,
     *     source_image?: string|null
     * }|null
     */
    private function getShopData(string $slug): ?array
    {
        $shop = Shop::where('slug', $slug)->first();
        if ($shop === null) {
            return null;
        }

        $loc = $shop->city ?: ($shop->location ?: 'Philippines');
        $subtitle = 'Halal Shop in '.$loc.' · Rating: '.$shop->rating.'/5';
        $badge = $shop->halal_only ? 'Halal-Only Shop' : 'Verified Halal Seller';
        $image = $shop->banner_url ?: $shop->logo_url;

        return [
            'title' => $shop->name,
            'subtitle' => $subtitle,
            'badge' => $badge,
            'source_image' => $image,
        ];
    }

    /**
     * @return array{
     *     title: string,
     *     subtitle: string,
     *     price?: string,
     *     badge: string,
     *     source_image?: string|null
     * }|null
     */
    private function getCategoryData(string $slug): ?array
    {
        $category = Category::where('slug', $slug)->first();
        if ($category === null) {
            return null;
        }

        $bestProduct = $category->products()->where('published', true)->orderByDesc('sold_count')->with('images')->first();
        $image = $bestProduct?->thumbnailUrl();

        return [
            'title' => $category->name,
            'subtitle' => 'Browse verified halal products on HalalBenta',
            'badge' => 'Verified Halal Selection',
            'source_image' => $image,
        ];
    }

    /**
     * @param  array{
     *     title: string,
     *     subtitle: string,
     *     price?: string,
     *     badge: string,
     *     source_image?: string|null
     * }  $data
     */
    private function renderCard(array $data, string $outputPath): bool
    {
        $im = imagecreatetruecolor(self::WIDTH, self::HEIGHT);
        if (! $im) {
            return false;
        }

        // Palette
        $bg = $this->allocateColor($im, 240, 247, 243); // soft green
        $dark = $this->allocateColor($im, 19, 34, 25);
        $muted = $this->allocateColor($im, 85, 105, 95);
        $green = $this->allocateColor($im, 23, 100, 60); // HalalBenta brand green
        $white = $this->allocateColor($im, 255, 255, 255);
        $borderCol = $this->allocateColor($im, 209, 224, 215);

        imagefilledrectangle($im, 0, 0, self::WIDTH, self::HEIGHT, $bg);

        // Fonts: prefer bundled fonts in resources/fonts, fallback to system fonts
        $boldFont = resource_path('fonts/LiberationSans-Bold.ttf');
        $regFont = resource_path('fonts/LiberationSans-Regular.ttf');
        if (! file_exists($boldFont) || ! file_exists($regFont)) {
            $boldFont = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
            $regFont = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf';
        }
        $hasFonts = file_exists($boldFont) && file_exists($regFont);

        // 1. Logo mark top-left
        $markPath = public_path('brand/halalbenta-icon-192.png');
        if (file_exists($markPath)) {
            $logo = @imagecreatefrompng($markPath);
            if ($logo) {
                imagecopyresampled($im, $logo, 60, 45, 0, 0, 60, 60, imagesx($logo), imagesy($logo));
            }
        }

        // HalalBenta brand text next to mark
        if ($hasFonts) {
            imagettftext($im, 20, 0, 135, 84, $green, $boldFont, 'HalalBenta');
        } else {
            imagestring($im, 5, 135, 68, 'HalalBenta', $green);
        }

        // 2. Title word wrapping (x: 60, y: 170)
        $titleLines = $this->wrapText($data['title'], 28);
        $titleY = 170;
        foreach (array_slice($titleLines, 0, 3) as $line) {
            if ($hasFonts) {
                imagettftext($im, 24, 0, 60, $titleY, $dark, $boldFont, $line);
            } else {
                imagestring($im, 5, 60, $titleY - 15, $line, $dark);
            }
            $titleY += 40;
        }

        // 3. Subtitle / seller
        $subY = max($titleY + 15, 300);
        if ($hasFonts) {
            imagettftext($im, 15, 0, 60, $subY, $muted, $regFont, mb_strimwidth($data['subtitle'], 0, 45, '...'));
        } else {
            imagestring($im, 4, 60, $subY - 12, mb_strimwidth($data['subtitle'], 0, 40, '...'), $muted);
        }

        // 4. Price if available
        if (! empty($data['price'])) {
            $priceY = $subY + 65;
            if ($hasFonts) {
                imagettftext($im, 36, 0, 60, $priceY, $green, $boldFont, $data['price']);
            } else {
                imagestring($im, 5, 60, $priceY - 20, $data['price'], $green);
            }
            $badgeY = $priceY + 50;
        } else {
            $badgeY = $subY + 50;
        }

        // 5. Halal Badge Pill
        $badgeText = '✓ '.mb_strimwidth($data['badge'], 0, 24, '…');
        $pillW = min(500, mb_strlen($badgeText) * 11 + 30);
        $pillH = 36;
        $pillX = 60;
        $this->drawFilledRoundedRect($im, $pillX, $badgeY - 26, $pillX + $pillW, $badgeY + 10, 8, $green);
        if ($hasFonts) {
            imagettftext($im, 13, 0, $pillX + 15, $badgeY - 3, $white, $boldFont, $badgeText);
        } else {
            imagestring($im, 4, $pillX + 12, $badgeY - 14, $badgeText, $white);
        }

        // 6. Right Content Box (white card, 520x520)
        $cardX = 620;
        $cardY = 55;
        $cardW = 520;
        $cardH = 520;
        $this->drawFilledRoundedRect($im, $cardX, $cardY, $cardX + $cardW, $cardY + $cardH, 16, $white);
        imagerectangle($im, $cardX, $cardY, $cardX + $cardW, $cardY + $cardH, $borderCol);

        // Load & place source image inside right card
        if (! empty($data['source_image'])) {
            $srcIm = $this->loadSourceImage($data['source_image']);
            if ($srcIm) {
                $sw = imagesx($srcIm);
                $sh = imagesy($srcIm);
                $padding = 30;
                $maxDestW = $cardW - ($padding * 2);
                $maxDestH = $cardH - ($padding * 2);

                $ratio = min($maxDestW / $sw, $maxDestH / $sh);
                $dw = (int) round($sw * $ratio);
                $dh = (int) round($sh * $ratio);

                $dx = $cardX + (int) round(($cardW - $dw) / 2);
                $dy = $cardY + (int) round(($cardH - $dh) / 2);

                imagecopyresampled($im, $srcIm, $dx, $dy, 0, 0, $dw, $dh, $sw, $sh);
            }
        }

        $saved = imagejpeg($im, $outputPath, self::JPEG_QUALITY);

        return (bool) $saved;
    }

    /**
     * @return array<int, string>
     */
    private function wrapText(string $text, int $maxChars): array
    {
        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            while (mb_strlen($word) > $maxChars) {
                if ($current !== '') {
                    $lines[] = $current;
                    $current = '';
                }
                $lines[] = mb_substr($word, 0, $maxChars);
                $word = mb_substr($word, $maxChars);
            }

            if ($word === '') {
                continue;
            }

            if (mb_strlen($current.' '.$word) <= $maxChars) {
                $current = $current === '' ? $word : $current.' '.$word;
            } else {
                if ($current !== '') {
                    $lines[] = $current;
                }
                $current = $word;
            }
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        if (count($lines) > 3) {
            $lines = array_slice($lines, 0, 3);
            $lines[2] = mb_strimwidth($lines[2], 0, $maxChars - 1, '…');
        }

        return $lines;
    }

    /**
     * imagecolorallocate() returns false when the palette is exhausted; a truecolor canvas never hits that,
     * so treat it as a hard failure instead of passing `false` on to the drawing functions.
     *
     * @param  int<0, 255>  $red
     * @param  int<0, 255>  $green
     * @param  int<0, 255>  $blue
     */
    private function allocateColor(GdImage $im, int $red, int $green, int $blue): int
    {
        $color = imagecolorallocate($im, $red, $green, $blue);

        if ($color === false) {
            throw new RuntimeException('Unable to allocate a GD colour.');
        }

        return $color;
    }

    private function drawFilledRoundedRect(GdImage $im, int $x1, int $y1, int $x2, int $y2, int $radius, int $color): void
    {
        imagefilledrectangle($im, $x1 + $radius, $y1, $x2 - $radius, $y2, $color);
        imagefilledrectangle($im, $x1, $y1 + $radius, $x2, $y2 - $radius, $color);
        imagefilledellipse($im, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($im, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($im, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($im, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
    }

    private function loadSourceImage(string $src): ?GdImage
    {
        try {
            $localPath = null;
            if (str_starts_with($src, '/')) {
                $localPath = public_path(mb_ltrim($src, '/'));
            } elseif (str_starts_with($src, url('/'))) {
                $rel = mb_substr($src, mb_strlen(url('/')));
                $localPath = public_path(mb_ltrim($rel, '/'));
            }

            if ($localPath !== null && file_exists($localPath)) {
                $info = @getimagesize($localPath);
                if (! $info) {
                    return null;
                }

                $image = match ($info[2]) {
                    IMAGETYPE_JPEG => @imagecreatefromjpeg($localPath),
                    IMAGETYPE_PNG => @imagecreatefrompng($localPath),
                    IMAGETYPE_WEBP => @imagecreatefromwebp($localPath),
                    default => null,
                };

                return $image === false ? null : $image;
            }

            // Remote image or storage url
            if (str_starts_with($src, 'http://') || str_starts_with($src, 'https://')) {
                $content = @file_get_contents($src, false, stream_context_create([
                    'http' => ['timeout' => 3],
                    'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
                ]));
                if ($content) {
                    return @imagecreatefromstring($content) ?: null;
                }
            }
        } catch (Throwable) {
            return null;
        }

        return null;
    }
}
