<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaId;

final readonly class BuildBreadcrumbNode
{
    /**
     * @param  string  $pageUrl  Canonical URL of the page the trail belongs to (used for the node `@id`).
     * @param  array<int, array{name: string, url: string}>  $trail  Ordered root → current page.
     * @return array<string, mixed>
     */
    public function handle(string $pageUrl, array $trail): array
    {
        $items = [];
        foreach (array_values($trail) as $position => $crumb) {
            $items[] = [
                '@type' => 'ListItem',
                'position' => $position + 1,
                'name' => $crumb['name'],
                'item' => $crumb['url'],
            ];
        }

        return [
            '@type' => 'BreadcrumbList',
            '@id' => SchemaId::breadcrumb($pageUrl),
            'itemListElement' => $items,
        ];
    }
}
