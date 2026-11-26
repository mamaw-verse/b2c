<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Models\BlogPost;
use App\Support\Blog\BlogImageData;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Support\Str;

final readonly class BuildBlogPostingNode
{
    /**
     * `BlogPosting` for a live post. The author is a reference to the `Person` node (or to the
     * Organization for the house author), so the graph resolves post → person → organization.
     * Expects `category`, `author`, `coverImage` and `tags` to be loaded.
     *
     * @return array<string, mixed>
     */
    public function handle(BlogPost $post, string $canonical, string $description): array
    {
        $author = $post->author;

        $images = [];
        if ($post->coverImage !== null) {
            $og = BlogImageData::ogUrl($post->coverImage);
            if ($og !== null) {
                $images[] = SeoData::absoluteUrl($og);
            }
            $images[] = SeoData::absoluteUrl(BlogImageData::for($post->coverImage, 'large')['src']);
        }

        return [
            '@type' => 'BlogPosting',
            '@id' => SchemaId::blogPost($post->slug),
            'url' => $canonical,
            'headline' => Str::limit((string) ($post->seo_title ?: $post->title), 110, ''),
            'description' => $description,
            'image' => array_values(array_unique($images)),
            'datePublished' => $post->published_at?->toIso8601String(),
            'dateModified' => $post->updated_at->toIso8601String(),
            'author' => SchemaGraph::ref($author->is_house ? SchemaId::organization() : SchemaId::person($author->slug)),
            'publisher' => SchemaGraph::ref(SchemaId::organization()),
            'mainEntityOfPage' => SchemaGraph::ref(SchemaId::webPage($canonical)),
            'articleSection' => $post->category->name,
            'keywords' => $post->tags->pluck('name')->implode(', '),
            'wordCount' => $post->word_count,
            'inLanguage' => (string) config('seo.language', 'en-PH'),
        ];
    }
}
