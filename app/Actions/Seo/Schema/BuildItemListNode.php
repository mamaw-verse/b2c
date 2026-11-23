<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaId;

final readonly class BuildItemListNode
{
    /**
     * With `type` + `id`, an entry becomes a typed stub (`ListItem.item`) sharing its `@id` with the
     * entity's own page, so listings and detail pages resolve to the same entity.
     *
     * @param  string  $pageUrl  Canonical URL of the listing page (used for the node `@id`).
     * @param  array<int, array{url: string, name: string, image?: string|null, type?: string, id?: string}>  $items
     * @return array<string, mixed>
     */
    public function handle(string $pageUrl, array $items): array
    {
        $elements = [];
        foreach (array_values($items) as $position => $item) {
            if (isset($item['type'], $item['id'])) {
                $elements[] = [
                    '@type' => 'ListItem',
                    'position' => $position + 1,
                    'item' => array_filter([
                        '@type' => $item['type'],
                        '@id' => $item['id'],
                        'url' => $item['url'],
                        'name' => $item['name'],
                        'image' => $item['image'] ?? null,
                    ], fn ($v) => $v !== null && $v !== ''),
                ];

                continue;
            }

            $elements[] = array_filter([
                '@type' => 'ListItem',
                'position' => $position + 1,
                'url' => $item['url'],
                'name' => $item['name'],
                'image' => $item['image'] ?? null,
            ], fn ($v) => $v !== null && $v !== '');
        }

        return [
            '@type' => 'ItemList',
            '@id' => SchemaId::itemList($pageUrl),
            'numberOfItems' => count($elements),
            'itemListElement' => $elements,
        ];
    }
}
