<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;

final readonly class BuildWebPageNode
{
    /**
     * Page-level wrapper node linking the page to the WebSite, its breadcrumb and its main entity.
     *
     * @param  string  $type  WebPage, CollectionPage, AboutPage, ...
     * @param  array<string, mixed>  $extra  Extra properties (e.g. `mainEntity`, `datePublished`).
     * @return array<string, mixed>
     */
    public function handle(
        string $type,
        string $url,
        string $name,
        string $description,
        ?string $breadcrumbId = null,
        ?string $primaryImage = null,
        array $extra = [],
    ): array {
        return [
            '@type' => $type,
            '@id' => SchemaId::webPage($url),
            'url' => $url,
            'name' => $name,
            'description' => $description,
            'inLanguage' => (string) config('seo.language', 'en-PH'),
            'isPartOf' => SchemaGraph::ref(SchemaId::website()),
            'breadcrumb' => $breadcrumbId !== null ? SchemaGraph::ref($breadcrumbId) : null,
            'primaryImageOfPage' => $primaryImage,
            ...$extra,
        ];
    }
}
