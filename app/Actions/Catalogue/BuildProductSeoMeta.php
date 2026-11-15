<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Product;
use Illuminate\Support\Str;

final readonly class BuildProductSeoMeta
{
    /**
     * @return array{
     *     title: string,
     *     description: string,
     *     url: string,
     *     image: string,
     *     site_name: string
     * }
     */
    public function handle(Product $product): array
    {
        $raw = mb_trim(strip_tags((string) $product->description));
        $collapsed = preg_replace('/\s+/', ' ', $raw);
        $collapsed = is_string($collapsed) ? mb_trim($collapsed) : '';

        $description = $collapsed !== ''
            ? Str::limit($collapsed, 200, '...')
            : $product->name;

        $photoUrl = $product->thumbnailUrl();
        if ($photoUrl !== null && $photoUrl !== '') {
            $image = str_starts_with($photoUrl, 'http://') || str_starts_with($photoUrl, 'https://')
                ? $photoUrl
                : url($photoUrl);
        } else {
            $image = url('/images/brand/logo.png');
        }

        return [
            'title' => $product->name,
            'description' => $description,
            'url' => route('products.show', $product),
            'image' => $image,
            'site_name' => (string) config('app.name', 'HalalBenta'),
        ];
    }
}
