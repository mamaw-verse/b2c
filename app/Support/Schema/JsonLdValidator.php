<?php

declare(strict_types=1);

namespace App\Support\Schema;

/**
 * Structural validator for the JSON-LD document emitted on every public page
 * (docs/planning/14 T5.1).
 *
 * It checks what search engines need to *parse* the data and what the plan promises
 * (one `@context` + `@graph`, a `@type` on every node, unique and resolvable `@id`s, no
 * empty values, absolute URLs) plus the properties Google requires for the types this
 * site emits. It does not replace the Rich Results Test (T5.2); it makes sure a regression
 * is caught by CI and by the weekly `seo:audit` before then.
 *
 * Errors fail a build or an audit. Warnings are recommended-but-optional properties.
 */
final class JsonLdValidator
{
    /** Property names whose string values must be absolute http(s) URLs. */
    private const array URL_KEYS = ['url', 'image', 'logo', 'contentUrl', 'item', 'sameAs', 'primaryImageOfPage'];

    /** Page-level types that must carry a `name` and `url`. */
    private const array PAGE_TYPES = ['WebPage', 'CollectionPage', 'AboutPage', 'ProfilePage', 'ContactPage', 'ItemPage'];

    /** ISO 8601 date or date-time, as `datePublished` / `dateModified` must be. */
    private const string ISO_DATE = '/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/';

    /** Longest `headline` Google documents for article rich results. */
    private const int HEADLINE_MAX = 110;

    /**
     * Extract and validate the single JSON-LD block of a rendered HTML page.
     *
     * @param  list<string>  $externalIds  `@id`s a page may reference without defining (sitewide Organization / WebSite).
     * @return array{errors: list<string>, warnings: list<string>}
     */
    public function validateHtml(string $html, array $externalIds = []): array
    {
        $blocks = $this->extract($html);

        if ($blocks === []) {
            return ['errors' => ['No <script type="application/ld+json"> block found.'], 'warnings' => []];
        }

        if (count($blocks) > 1) {
            return ['errors' => ['Expected exactly one JSON-LD block, found '.count($blocks).'.'], 'warnings' => []];
        }

        $document = json_decode($blocks[0], true);

        if (! is_array($document)) {
            return ['errors' => ['JSON-LD block is not valid JSON ('.json_last_error_msg().').'], 'warnings' => []];
        }

        return $this->validateDocument($document, $externalIds);
    }

    /**
     * @return list<string> Raw contents of every JSON-LD script block.
     */
    public function extract(string $html): array
    {
        preg_match_all('#<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>#is', $html, $matches);

        return array_values(array_map('trim', $matches[1]));
    }

    /**
     * @param  array<int|string, mixed>  $document
     * @param  list<string>  $externalIds
     * @return array{errors: list<string>, warnings: list<string>}
     */
    public function validateDocument(array $document, array $externalIds = []): array
    {
        $errors = [];
        $warnings = [];

        if (($document['@context'] ?? null) !== SchemaGraph::CONTEXT) {
            $errors[] = '@context must be '.SchemaGraph::CONTEXT.'.';
        }

        $graph = $document['@graph'] ?? null;

        if (! is_array($graph) || $graph === [] || ! array_is_list($graph)) {
            $errors[] = '@graph must be a non-empty list of nodes.';

            return ['errors' => $errors, 'warnings' => $warnings];
        }

        $topLevelIds = [];

        foreach ($graph as $index => $node) {
            if (! is_array($node) || ! $this->hasType($node)) {
                $errors[] = "@graph[{$index}] has no @type.";

                continue;
            }

            $id = $node['@id'] ?? null;

            if (is_string($id)) {
                if (in_array($id, $topLevelIds, true)) {
                    $errors[] = "@graph[{$index}] repeats the @id {$id}.";
                }

                $topLevelIds[] = $id;
            }
        }

        $refs = [];
        $ids = [];

        $this->walk($graph, '@graph', null, $errors, $warnings, $refs, $ids);

        $known = [...$topLevelIds, ...$ids, ...$externalIds];

        foreach (array_unique($refs) as $ref) {
            if (! in_array($ref, $known, true)) {
                $errors[] = "Reference to {$ref} does not resolve inside the graph.";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Every absolute image / logo URL mentioned in a document (for HTTP checks in the audit).
     *
     * @param  array<int|string, mixed>  $document
     * @return list<string>
     */
    public function imageUrls(array $document): array
    {
        $urls = [];

        $collect = function (mixed $value, ?string $parentKey) use (&$collect, &$urls): void {
            if (is_array($value) && ($value['@type'] ?? null) === 'ImageObject' && is_string($value['url'] ?? null)
                && preg_match('#^https?://#i', $value['url']) === 1) {
                $urls[] = $value['url'];
            }

            if (! is_array($value)) {
                if (is_string($value) && in_array($parentKey, ['image', 'logo', 'primaryImageOfPage', 'thumbnailUrl', 'contentUrl'], true)
                    && preg_match('#^https?://#i', $value) === 1) {
                    $urls[] = $value;
                }

                return;
            }

            foreach ($value as $key => $item) {
                $collect($item, is_int($key) ? $parentKey : $key);
            }
        };

        $collect($document['@graph'] ?? [], null);

        return array_values(array_unique($urls));
    }

    /**
     * @param  array<int|string, mixed>  $value
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     * @param  list<string>  $refs
     * @param  list<string>  $ids
     */
    private function walk(array $value, string $path, ?string $parentKey, array &$errors, array &$warnings, array &$refs, array &$ids): void
    {
        foreach ($value as $key => $item) {
            $itemPath = is_int($key) ? "{$path}[{$key}]" : "{$path}.{$key}";
            $effectiveKey = is_int($key) ? $parentKey : $key;

            if (! is_array($item)) {
                if ($item === null || $item === '') {
                    $errors[] = "{$itemPath} is empty.";
                } elseif (is_string($item) && in_array($effectiveKey, self::URL_KEYS, true) && preg_match('#^https?://#i', $item) !== 1) {
                    $errors[] = "{$itemPath} must be an absolute URL, got \"{$item}\".";
                }

                continue;
            }

            if ($item === []) {
                $errors[] = "{$itemPath} is an empty array.";

                continue;
            }

            if (! array_is_list($item)) {
                $id = $item['@id'] ?? null;

                if (is_string($id)) {
                    if (count($item) === 1) {
                        $refs[] = $id;
                    } else {
                        $ids[] = $id;
                    }
                }

                if ($this->hasType($item)) {
                    $this->checkNode($item, $itemPath, $errors, $warnings);
                }
            }

            $this->walk($item, $itemPath, $effectiveKey, $errors, $warnings, $refs, $ids);
        }
    }

    /**
     * @param  array<int|string, mixed>  $node
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    private function checkNode(array $node, string $path, array &$errors, array &$warnings): void
    {
        // A graph node (or a variant) is a full entity; elsewhere the same @type is a lightweight stub.
        $isFullNode = preg_match('/^@graph\[\d+\]$|\.hasVariant\[\d+\]$/', $path) === 1;
        $isTopLevel = preg_match('/^@graph\[\d+\]$/', $path) === 1;

        foreach ($this->types($node) as $type) {
            switch (true) {
                case $type === 'Product' || $type === 'ProductGroup':
                    $this->require($node, ['name'], $path, $errors);

                    if (! $isFullNode) {
                        break;
                    }

                    if ($type === 'ProductGroup') {
                        $this->require($node, ['hasVariant'], $path, $errors);
                    } elseif (! isset($node['offers']) && ! isset($node['aggregateRating']) && ! isset($node['review'])) {
                        $errors[] = "{$path} (Product) needs offers, aggregateRating or review.";
                    }

                    if (! isset($node['image'])) {
                        $warnings[] = "{$path} (Product) has no image.";
                    }

                    break;

                case $type === 'Offer':
                    $this->require($node, ['price', 'priceCurrency', 'availability'], $path, $errors);

                    if (isset($node['price']) && ! is_numeric($node['price'])) {
                        $errors[] = "{$path}.price must be numeric.";
                    }

                    break;

                case $type === 'AggregateRating':
                    $this->require($node, ['ratingValue'], $path, $errors);

                    if (! isset($node['reviewCount']) && ! isset($node['ratingCount'])) {
                        $errors[] = "{$path} (AggregateRating) needs reviewCount or ratingCount.";
                    }

                    break;

                case $type === 'Review':
                    $this->require($node, ['author', 'reviewRating'], $path, $errors);

                    break;

                case $type === 'BreadcrumbList':
                    $this->require($node, ['itemListElement'], $path, $errors);

                    foreach ((array) ($node['itemListElement'] ?? []) as $position => $crumb) {
                        if (! is_array($crumb) || ! isset($crumb['position'], $crumb['name'])) {
                            $errors[] = "{$path}.itemListElement[{$position}] needs position and name.";
                        }
                    }

                    break;

                case $type === 'ItemList':
                    $this->require($node, ['itemListElement'], $path, $errors);

                    break;

                case $type === 'ListItem':
                    $this->require($node, ['position'], $path, $errors);

                    break;

                case $type === 'Organization':
                    $this->require($node, ['name'], $path, $errors);

                    if ($isTopLevel) {
                        $this->require($node, ['url'], $path, $errors);
                    }

                    break;

                case $type === 'WebSite':
                    $this->require($node, ['name', 'url'], $path, $errors);

                    break;

                case $type === 'Store':
                    $this->require($node, ['name'], $path, $errors);

                    break;

                case $type === 'FAQPage':
                    $this->require($node, ['mainEntity'], $path, $errors);

                    foreach ((array) ($node['mainEntity'] ?? []) as $position => $question) {
                        if (! is_array($question) || ! isset($question['name'], $question['acceptedAnswer']['text'])) {
                            $errors[] = "{$path}.mainEntity[{$position}] needs a name and an acceptedAnswer.text.";
                        }
                    }

                    break;

                case $type === 'Article':
                    $this->require($node, ['headline'], $path, $errors);

                    if (! isset($node['datePublished'])) {
                        $warnings[] = "{$path} (Article) has no datePublished.";
                    }

                    break;

                case $type === 'BlogPosting':
                    // Elsewhere (the blog index's ItemList) a BlogPosting is a lightweight stub.
                    if (! $isFullNode) {
                        break;
                    }

                    $this->checkBlogPosting($node, $path, $errors, $warnings);

                    break;

                case $type === 'Blog':
                    if ($isTopLevel) {
                        $this->require($node, ['name', 'url'], $path, $errors);
                    }

                    break;

                case $type === 'Person':
                    // A deactivated author is still credited, but has no page, so `url` is optional.
                    $this->require($node, ['name'], $path, $errors);

                    break;

                case $type === 'ProfilePage':
                    if ($isTopLevel) {
                        $this->require($node, ['name', 'url', 'mainEntity'], $path, $errors);
                    }

                    break;

                case in_array($type, self::PAGE_TYPES, true):
                    if ($isTopLevel) {
                        $this->require($node, ['name', 'url'], $path, $errors);
                    }

                    break;
            }
        }
    }

    /**
     * `BlogPosting` (docs/planning/15-blog.md B3.5): the article properties Google needs plus the
     * references that tie post → person → organization together.
     *
     * @param  array<int|string, mixed>  $node
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    private function checkBlogPosting(array $node, string $path, array &$errors, array &$warnings): void
    {
        $this->require($node, ['headline', 'image', 'datePublished', 'author'], $path, $errors);

        if (isset($node['headline']) && is_string($node['headline']) && mb_strlen($node['headline']) > self::HEADLINE_MAX) {
            $errors[] = "{$path}.headline is longer than ".self::HEADLINE_MAX.' characters.';
        }

        foreach (['datePublished', 'dateModified'] as $key) {
            if (isset($node[$key]) && (! is_string($node[$key]) || preg_match(self::ISO_DATE, $node[$key]) !== 1)) {
                $errors[] = "{$path}.{$key} must be an ISO 8601 date.";
            }
        }

        foreach (['dateModified', 'publisher', 'description', 'mainEntityOfPage'] as $key) {
            if (! isset($node[$key])) {
                $warnings[] = "{$path} (BlogPosting) has no {$key}.";
            }
        }
    }

    /**
     * @param  array<int|string, mixed>  $node
     * @param  list<string>  $keys
     * @param  list<string>  $errors
     */
    private function require(array $node, array $keys, string $path, array &$errors): void
    {
        foreach ($keys as $key) {
            if (! isset($node[$key])) {
                $errors[] = "{$path} is missing required property \"{$key}\".";
            }
        }
    }

    /**
     * @param  array<int|string, mixed>  $node
     */
    private function hasType(array $node): bool
    {
        return $this->types($node) !== [];
    }

    /**
     * @param  array<int|string, mixed>  $node
     * @return list<string>
     */
    private function types(array $node): array
    {
        $type = $node['@type'] ?? null;

        if (is_string($type) && $type !== '') {
            return [$type];
        }

        if (is_array($type)) {
            return array_values(array_filter($type, static fn (mixed $t): bool => is_string($t) && $t !== ''));
        }

        return [];
    }
}
