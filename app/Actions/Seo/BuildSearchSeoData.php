<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;
use Illuminate\Http\Request;

final readonly class BuildSearchSeoData
{
    public function handle(string $query, ?Request $request = null): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/search";

        $cleanQ = mb_trim($query);
        $title = $cleanQ !== ''
            ? "Search results for \"{$cleanQ}\" | HalalBenta"
            : 'Search Halal Products | HalalBenta';
        $description = 'Search verified halal products across the Philippines on HalalBenta. Escrow-protected checkout and nationwide delivery.';
        $socialImage = "{$origin}/social/default-og.jpg";

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: 'noindex, follow',
            og: [
                'site_name' => 'HalalBenta',
                'locale' => 'en_PH',
                'type' => 'website',
                'title' => $title,
                'description' => $description,
                'url' => $canonical,
                'image' => $socialImage,
                'image_width' => 1200,
                'image_height' => 630,
                'image_alt' => 'Search HalalBenta',
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => 'Search HalalBenta',
            ],
            jsonLd: [],
        );
    }
}
