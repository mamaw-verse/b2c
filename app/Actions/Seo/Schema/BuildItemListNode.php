<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaId;

final readonly class BuildItemListNode
{
    /**
     * @param  string  $pageUrl  Canonical URL of the listing page (used for the node `@id`).
     * @param  array<int, array{url: string, name: string, image?: string|null}>  $items
     * @return array<string, mixed>
     */
    public function handle(string $pageUrl, array $items): array
    {
        $elements = [];
        foreach (array_values($items) as $position => $item) {
            $elements[] = [
                '@type' => 'ListItem',
                'position' => $position + 1,
                'url' => $item['url'],
                'name' => $item['name'],
                'image' => $item['image'] ?? null,
            ];
        }

        return [
            '@type' => 'ItemList',
            '@id' => SchemaId::itemList($pageUrl),
            'numberOfItems' => count($elements),
            'itemListElement' => $elements,
        ];
    }
}
