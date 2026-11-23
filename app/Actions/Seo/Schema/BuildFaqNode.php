<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;

final readonly class BuildFaqNode
{
    /**
     * `FAQPage` for Q&A that is visible on the page. Returns null when there are no entries, so a
     * page without a visible FAQ never carries FAQ markup.
     *
     * @param  list<array{question: string, answer: string}>  $entries
     * @return array<string, mixed>|null
     */
    public function handle(string $pageUrl, array $entries): ?array
    {
        if ($entries === []) {
            return null;
        }

        return [
            '@type' => 'FAQPage',
            '@id' => SchemaId::faq($pageUrl),
            'url' => $pageUrl,
            'inLanguage' => (string) config('seo.language', 'en-PH'),
            'isPartOf' => SchemaGraph::ref(SchemaId::webPage($pageUrl)),
            'mainEntity' => array_map(static fn (array $entry): array => [
                '@type' => 'Question',
                'name' => $entry['question'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $entry['answer'],
                ],
            ], $entries),
        ];
    }
}
