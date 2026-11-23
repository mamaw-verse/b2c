<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

final readonly class BuildWebSiteNode
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $origin = SeoData::canonicalOrigin();

        return [
            '@type' => 'WebSite',
            '@id' => SchemaId::website(),
            'name' => (string) config('seo.site_name', 'HalalBenta'),
            'url' => $origin.'/',
            'inLanguage' => (string) config('seo.language', 'en-PH'),
            'publisher' => SchemaGraph::ref(SchemaId::organization()),
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => [
                    '@type' => 'EntryPoint',
                    'urlTemplate' => "{$origin}/search?q={search_term_string}",
                ],
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }
}
