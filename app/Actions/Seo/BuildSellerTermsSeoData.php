<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;

final readonly class BuildSellerTermsSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/seller/terms";

        $title = 'Seller Terms & Merchant Agreement | HalalBenta';
        $description = 'Read the terms and conditions for verified sellers, halal merchants, and store operators on the HalalBenta marketplace in the Philippines.';
        $socialImage = SeoData::defaultOgImage();

        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => 'Seller Terms', 'url' => $canonical],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: 'Seller Terms & Conditions',
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $socialImage,
            ))
            ->add($breadcrumb);

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: SeoData::isStaging() ? 'noindex, nofollow' : SeoData::INDEXABLE_ROBOTS,
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
            author: 'HalalBenta Legal & Compliance',
            jsonLd: $graph->toArray(),
        );
    }
}
