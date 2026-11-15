<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;

final readonly class BuildContentPageSeoData
{
    /**
     * @param  array<string, mixed>  $pageData
     */
    public function handle(string $pageKey, array $pageData): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/pages/{$pageKey}";

        $pageTitle = (string) ($pageData['title'] ?? ucfirst(str_replace('-', ' ', $pageKey)));
        $title = "{$pageTitle} | HalalBenta";

        $descriptions = [
            'returns' => 'Learn about returns and refunds on HalalBenta. Request returns within 7 days, resolve disputes, and enjoy escrow-protected buyer protection.',
            'help' => 'HalalBenta Help Centre. Find answers to frequently asked questions about orders, payments, shipping, halal verification, and customer support.',
            'about' => 'About HalalBenta – the Philippines’ verified halal online marketplace connecting conscious consumers with trusted halal sellers and official brands.',
            'terms' => 'Read the HalalBenta customer Terms of Service outlining marketplace guidelines, user obligations, escrow protection, and acceptable use policies.',
            'privacy' => 'HalalBenta Privacy Policy explaining how we collect, use, and protect your personal data in compliance with data privacy laws in the Philippines.',
            'halal-verification' => 'How HalalBenta verifies halal claims, inspects certifications, and monitors Muslim-friendly compliance across sellers in the Philippines.',
        ];

        $description = $descriptions[$pageKey] ?? "Read the {$pageTitle} guidelines and details for shopping and selling on HalalBenta in the Philippines.";
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
                'name' => $pageTitle,
                'item' => $canonical,
            ],
        ];

        $webPageSchema = [
            '@type' => $pageKey === 'halal-verification' ? 'Article' : 'WebPage',
            'name' => $pageTitle,
            'description' => $description,
            'url' => $canonical,
        ];

        $jsonLd = [
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs,
            ],
            $webPageSchema,
        ];

        if ($pageKey === 'about') {
            $jsonLd[] = [
                '@type' => 'Organization',
                'name' => 'HalalBenta',
                'url' => $origin,
                'logo' => "{$origin}/images/brand/logo.png",
            ];
        }

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
                'image_alt' => $title,
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => $title,
            ],
            jsonLd: $jsonLd,
        );
    }
}
