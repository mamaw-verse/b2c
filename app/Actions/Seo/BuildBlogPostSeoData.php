<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\BlogPost;
use App\Support\Blog\BlogImageData;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;
use Illuminate\Support\Str;

/**
 * SEO for a post: article Open Graph tags with real dates (plan §8). The `BlogPosting` / `Person`
 * JSON-LD arrives in Phase 3 (B3.1); until then the graph holds the page and breadcrumb nodes.
 * Expects `category`, `author` and `coverImage` to be loaded.
 */
final readonly class BuildBlogPostSeoData
{
    public function handle(BlogPost $post): SeoData
    {
        $canonical = BlogSeo::url($post->slug);
        $description = Str::limit(mb_trim((string) ($post->seo_description ?: $post->excerpt)), 160, '…');

        $cover = $post->coverImage;
        $ogUrl = $cover === null ? null : BlogImageData::ogUrl($cover);
        $image = $cover === null ? null : [
            'url' => SeoData::absoluteUrl($ogUrl ?? BlogImageData::for($cover, 'large')['src']),
            'width' => $ogUrl !== null ? 1200 : (int) ($cover->variants['large']['width'] ?? $cover->width),
            'height' => $ogUrl !== null ? 630 : (int) ($cover->variants['large']['height'] ?? $cover->height),
            'alt' => (string) $cover->alt,
            'type' => $ogUrl !== null ? 'image/jpeg' : 'image/webp',
        ];

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => config()->string('blog.title', 'HalalBenta Blog'), 'url' => BlogSeo::url()],
            ['name' => $post->category->name, 'url' => BlogSeo::url("category/{$post->category->slug}")],
            ['name' => $post->title, 'url' => $canonical],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $post->title,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $image['url'] ?? null,
            ))
            ->add($breadcrumb);

        $author = $post->author;

        return BlogSeo::make(
            title: BlogSeo::title((string) ($post->seo_title ?: $post->title)),
            description: $description,
            canonical: $canonical,
            robots: BlogSeo::robots($post->isLive()),
            image: $image,
            article: array_filter([
                'published_time' => $post->published_at?->toIso8601String(),
                'modified_time' => $post->updated_at?->toIso8601String(),
                'section' => $post->category->name,
                // The author page URL for people; the house author has no page, so no `article:author`.
                'author' => $author->is_house || ! $author->is_active ? null : BlogSeo::url("author/{$author->slug}"),
            ]),
            jsonLd: $graph->toArray(),
            author: $author->display_name,
        );
    }
}
