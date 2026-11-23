<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildOrganizationNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Actions\Seo\Schema\BuildWebSiteNode;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

final readonly class BuildHomeSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/";

        $title = 'HalalBenta – Verified Halal Marketplace in the Philippines';
        $description = 'Shop verified halal food, meat & seafood, dates & sweets, modest fashion, prayer essentials and more. Escrow-protected checkout, delivered across the Philippines.';
        $socialImage = SeoData::defaultOgImage();

        $graph = SchemaGraph::make()
            ->add(resolve(BuildOrganizationNode::class)->handle())
            ->add(resolve(BuildWebSiteNode::class)->handle())
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $title,
                description: $description,
                primaryImage: $socialImage,
                extra: ['about' => SchemaGraph::ref(SchemaId::organization())],
            ));

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
            jsonLd: $graph->toArray(),
        );
    }
}
