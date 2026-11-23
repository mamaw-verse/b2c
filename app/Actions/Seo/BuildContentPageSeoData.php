<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildFaqNode;
use App\Actions\Seo\Schema\BuildOrganizationNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Support\Schema\SchemaGraph;
use App\Support\FaqEntries;
use App\Support\SeoData;
use App\Support\TrustFacts;

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

        $returnsDescription = 'Learn about returns and refunds on HalalBenta. '
            .(TrustFacts::returnWindowShort() ?? 'Check how return requests are handled')
            .', resolve disputes, and enjoy escrow-protected buyer protection.';

        $descriptions = [
            'returns' => $returnsDescription,
            'help' => 'HalalBenta Help Centre. Find answers to frequently asked questions about orders, payments, shipping, halal verification, and customer support.',
            'about' => 'About HalalBenta – the Philippines’ verified halal online marketplace connecting conscious consumers with trusted halal sellers and official brands.',
            'terms' => 'Read the HalalBenta customer Terms of Service outlining marketplace guidelines, user obligations, escrow protection, and acceptable use policies.',
            'privacy' => 'HalalBenta Privacy Policy explaining how we collect, use, and protect your personal data in compliance with data privacy laws in the Philippines.',
            'halal-verification' => 'How HalalBenta verifies halal claims, inspects certifications, and monitors Muslim-friendly compliance across sellers in the Philippines.',
        ];

        $description = $descriptions[$pageKey] ?? "Read the {$pageTitle} guidelines and details for shopping and selling on HalalBenta in the Philippines.";
        $socialImage = SeoData::defaultOgImage();

        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => $pageTitle, 'url' => $canonical],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: $pageKey === 'halal-verification' ? 'Article' : 'WebPage',
                url: $canonical,
                name: $pageTitle,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $socialImage,
            ))
            ->add($breadcrumb);

        $graph->add(resolve(BuildFaqNode::class)->handle($canonical, FaqEntries::for($pageKey)));

        if ($pageKey === 'about') {
            $graph->add(resolve(BuildOrganizationNode::class)->handle());
        }

        $author = $pageKey === 'halal-verification'
            ? 'HalalBenta Halal Assurance Team'
            : 'HalalBenta';

        $og = [
            'site_name' => 'HalalBenta',
            'locale' => 'en_PH',
            'type' => $pageKey === 'halal-verification' ? 'article' : 'website',
            'title' => $title,
            'description' => $description,
            'url' => $canonical,
            'image' => $socialImage,
            'image_width' => 1200,
            'image_height' => 630,
            'image_alt' => $title,
            'image_type' => 'image/jpeg',
        ];

        if ($pageKey === 'halal-verification') {
            $og['article'] = [
                'author' => $author,
                'section' => 'Halal Standards',
            ];
        }

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: SeoData::isStaging() ? 'noindex, nofollow' : SeoData::INDEXABLE_ROBOTS,
            og: $og,
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => $title,
            ],
            author: $author,
            jsonLd: $graph->toArray(),
        );
    }
}
