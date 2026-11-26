<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Models\BlogAuthor;
use App\Support\Blog\BlogImageData;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

final readonly class BuildPersonNode
{
    /**
     * A real, consenting blog author (docs/planning/15-blog.md §4.7). The house author is never a
     * `Person`: posts credit the Organization instead. `url` is only emitted while the author page
     * exists (active authors); a deactivated author is still credited but has no page.
     *
     * Expects `avatar` to be loaded. Only https links reach `sameAs`.
     *
     * @return array<string, mixed>
     */
    public function handle(BlogAuthor $author): array
    {
        $sameAs = [];
        foreach ((array) $author->links as $link) {
            if (str_starts_with(mb_strtolower($link['url']), 'https://')) {
                $sameAs[] = $link['url'];
            }
        }

        return [
            '@type' => 'Person',
            '@id' => SchemaId::person($author->slug),
            'name' => $author->display_name,
            'jobTitle' => $author->job_title,
            'description' => $author->bio,
            'image' => $author->avatar === null
                ? null
                : SeoData::absoluteUrl(BlogImageData::avatar($author->avatar)['src']),
            'sameAs' => array_slice($sameAs, 0, 4),
            'url' => $author->is_active ? BlogSeo::url("author/{$author->slug}") : null,
        ];
    }
}
