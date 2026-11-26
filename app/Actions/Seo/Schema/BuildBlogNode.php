<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;

final readonly class BuildBlogNode
{
    /**
     * The `Blog` entity for `/blog`. Posts on the current page are listed as references whose
     * stubs (sharing the posts' own `@id`s) live in the page's `ItemList`.
     *
     * @param  list<string>  $postSlugs
     * @return array<string, mixed>
     */
    public function handle(string $name, string $description, array $postSlugs): array
    {
        return [
            '@type' => 'Blog',
            '@id' => SchemaId::blog(),
            'url' => BlogSeo::url(),
            'name' => $name,
            'description' => $description,
            'inLanguage' => (string) config('seo.language', 'en-PH'),
            'publisher' => SchemaGraph::ref(SchemaId::organization()),
            'blogPost' => array_map(static fn (string $slug): array => SchemaGraph::ref(SchemaId::blogPost($slug)), $postSlugs),
        ];
    }
}
