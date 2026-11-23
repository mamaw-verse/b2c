<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildFaqNode;
use App\Actions\Seo\Schema\BuildOrganizationNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Support\FaqEntries;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

final readonly class BuildWhyChooseUsSeoData
{
    public function handle(): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/why-choose-us";

        $title = 'Why Choose HalalBenta – Trusted Halal Marketplace';
        $description = 'Discover why buyers across the Philippines trust HalalBenta: strictly verified halal certificates, escrow-protected payments, and fresh nationwide delivery.';
        $socialImage = SeoData::defaultOgImage();

        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => 'Why Choose HalalBenta', 'url' => $canonical],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $title,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $socialImage,
                extra: ['about' => SchemaGraph::ref(SchemaId::organization())],
            ))
            ->add($breadcrumb)
            ->add(resolve(BuildFaqNode::class)->handle($canonical, FaqEntries::for('why-choose-us')))
            ->add(resolve(BuildOrganizationNode::class)->handle());

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
            author: 'HalalBenta',
            jsonLd: $graph->toArray(),
        );
    }
}
