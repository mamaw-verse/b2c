<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;

final readonly class BuildSellerTermsSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/seller/terms";

        $title = 'Seller Terms & Merchant Agreement | HalalBenta';
        $description = 'Read the terms and conditions for verified sellers, halal merchants, and store operators on the HalalBenta marketplace in the Philippines.';
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
                'name' => 'Seller Terms',
                'item' => $canonical,
            ],
        ];

        $jsonLd = [
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs,
            ],
            [
                '@type' => 'WebPage',
                'name' => 'Seller Terms & Conditions',
                'description' => $description,
                'url' => $canonical,
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
                'image_alt' => 'HalalBenta Seller Terms',
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => 'HalalBenta Seller Terms',
            ],
            jsonLd: $jsonLd,
        );
    }
}
