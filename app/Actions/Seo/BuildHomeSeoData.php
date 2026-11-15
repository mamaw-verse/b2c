<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;

final readonly class BuildHomeSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/";

        $title = 'HalalBenta – Verified Halal Marketplace in the Philippines';
        $description = 'Shop verified halal food, meat & seafood, dates & sweets, modest fashion, prayer essentials and more. Escrow-protected checkout, delivered across the Philippines.';
        $socialImage = "{$origin}/social/default-og.jpg";

        $socialLinks = collect(config()->array('marketplace.socials', []))
            ->pluck('href')
            ->filter()
            ->values()
            ->all();

        $organizationSchema = [
            '@type' => 'Organization',
            'name' => 'HalalBenta',
            'url' => $origin,
            'logo' => "{$origin}/images/brand/logo.png",
        ];

        if (! empty($socialLinks)) {
            $organizationSchema['sameAs'] = $socialLinks;
        }

        $websiteSchema = [
            '@type' => 'WebSite',
            'name' => 'HalalBenta',
            'url' => $origin,
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => [
                    '@type' => 'EntryPoint',
                    'urlTemplate' => "{$origin}/search?q={search_term_string}",
                ],
                'query-input' => 'required name=search_term_string',
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
                'image_alt' => 'HalalBenta – Verified Halal Marketplace in the Philippines',
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => 'HalalBenta – Verified Halal Marketplace in the Philippines',
            ],
            jsonLd: [$organizationSchema, $websiteSchema],
        );
    }
}
