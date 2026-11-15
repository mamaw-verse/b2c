<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;

final readonly class BuildWhyChooseUsSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/why-choose-us";

        $title = 'Why Choose HalalBenta – Trusted Halal Marketplace';
        $description = 'Discover why buyers across the Philippines trust HalalBenta: strictly verified halal certificates, escrow-protected payments, and fresh nationwide delivery.';
        $socialImage = "{$origin}/social/default-og.jpg";

        $breadcrumbs = [
            [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => 'Home',
                'item' => "{$origin}/",
            ],
            [
                '@type' => 'ListItem',
                'position' => 2,
                'name' => 'Why Choose HalalBenta',
                'item' => $canonical,
            ],
        ];

        $jsonLd = [
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs,
            ],
            [
                '@type' => 'Organization',
                'name' => 'HalalBenta',
                'url' => $origin,
                'logo' => "{$origin}/images/brand/logo.png",
            ],
        ];

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: SeoData::isStaging() ? 'noindex, nofollow' : 'index, follow',
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
                'image_alt' => 'Why Choose HalalBenta',
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => 'Why Choose HalalBenta',
            ],
            jsonLd: $jsonLd,
        );
    }
}
