<?php

declare(strict_types=1);

namespace App\Support\Schema;

/**
 * Collects schema.org nodes and emits one `{"@context": ..., "@graph": [...]}` document.
 *
 * - Adds `@context` exactly once.
 * - De-dupes nodes by `@id` (later properties fill gaps, never overwrite).
 * - Recursively strips null / empty-string / empty-array values so only real data is published.
 * - Encodes safely for an inline `<script type="application/ld+json">` element.
 */
final class SchemaGraph
{
    public const string CONTEXT = 'https://schema.org';

    /** @var array<int, array<string, mixed>> */
    private array $nodes = [];

    /** @var array<string, int> @id => index in */
    private array $index = [];

    public static function make(): self
    {
        return new self;
    }

    /**
     * Reference an entity by `@id` instead of re-embedding it.
     *
     * @return array{'@id': string}
     */
    public static function ref(string $id): array
    {
        return ['@id' => $id];
    }

    /**
     * Encode a JSON-LD document for a `<script>` element.
     *
     * Accepts a full document, or a bare list of nodes (a `@context` is added),
     * so a builder that forgets the wrapper can never ship invalid structured data.
     *
     * @param  array<int|string, mixed>  $document
     */
    public static function encode(array $document): string
    {
        if ($document === []) {
            return '';
        }

        if (! isset($document['@context'])) {
            $nodes = array_is_list($document) ? $document : [$document];
            $document = [
                '@context' => self::CONTEXT,
                '@graph' => $nodes,
            ];
        }

        $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR;

        $json = json_encode(self::clean($document), $flags);

        return $json === false ? '' : $json;
    }

    /**
     * Recursively drop null, empty strings and empty arrays. Keeps 0, 0.0, '0' and false.
     */
    public static function clean(mixed $value): mixed
    {
        if (! is_array($value)) {
            return is_string($value) ? mb_trim($value) : $value;
        }

        $isList = array_is_list($value);
        $result = [];

        foreach ($value as $key => $item) {
            $item = self::clean($item);

            if ($item === null || $item === '' || $item === []) {
                continue;
            }

            if ($isList) {
                $result[] = $item;
            } else {
                $result[$key] = $item;
            }
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>|null  $node
     */
    public function add(?array $node): self
    {
        if ($node === null || $node === []) {
            return $this;
        }

        $id = $node['@id'] ?? null;

        if (is_string($id) && $id !== '' && isset($this->index[$id])) {
            $position = $this->index[$id];
            $this->nodes[$position] += $node;

            return $this;
        }

        $this->nodes[] = $node;

        if (is_string($id) && $id !== '') {
            $this->index[$id] = array_key_last($this->nodes);
        }

        return $this;
    }

    /**
     * @return array<string, mixed> Empty array when the graph has no nodes.
     */
    public function toArray(): array
    {
        $graph = [];
        foreach ($this->nodes as $node) {
            $cleaned = self::clean($node);
            if (is_array($cleaned) && $cleaned !== []) {
                $graph[] = $cleaned;
            }
        }

        if ($graph === []) {
            return [];
        }

        return [
            '@context' => self::CONTEXT,
            '@graph' => $graph,
        ];
    }

    public function toJson(): string
    {
        return self::encode($this->toArray());
    }
}
