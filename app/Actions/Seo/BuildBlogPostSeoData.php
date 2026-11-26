<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBlogPostingNode;
use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildPersonNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\BlogPost;
use App\Support\Blog\BlogImageData;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Support\Str;

/**
 * SEO for a post: article Open Graph tags with real dates, the cover's 1200x630 `og` JPEG as
 * `og:image`, and a graph of WebPage → BlogPosting → Person (or the Organization for the house
 * author) + BreadcrumbList. Expects `category`, `author.avatar`, `coverImage` and `tags` to be
 * loaded (`ShowBlogPost` does that).
 */
final readonly class BuildBlogPostSeoData
{
    public function handle(BlogPost $post): SeoData
    {
        $canonical = BlogSeo::url($post->slug);
        $description = Str::limit(mb_trim((string) ($post->seo_description ?: $post->excerpt)), 160, '…');
        $author = $post->author;

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => config()->string('blog.title', 'HalalBenta Blog'), 'url' => BlogSeo::url()],
            ['name' => $post->category->name, 'url' => BlogSeo::url("category/{$post->category->slug}")],
            ['name' => $post->title, 'url' => $canonical],
        ]);

        $image = $this->image($post);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $post->title,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $image['url'] ?? null,
                extra: ['mainEntity' => SchemaGraph::ref(SchemaId::blogPost($post->slug))],
            ))
            ->add(resolve(BuildBlogPostingNode::class)->handle($post, $canonical, $description))
            ->add($breadcrumb);

        // The house author is the Organization (already sitewide); only real people get a Person node.
        if (! $author->is_house) {
            $graph->add(resolve(BuildPersonNode::class)->handle($author));
        }

        return BlogSeo::make(
            title: BlogSeo::title((string) ($post->seo_title ?: $post->title)),
            description: $description,
            canonical: $canonical,
            robots: BlogSeo::robots($post->isLive()),
            image: $image,
            article: array_filter([
                'published_time' => $post->published_at?->toIso8601String(),
                'modified_time' => $post->updated_at->toIso8601String(),
                'section' => $post->category->name,
                // The author page URL for people; the house author and deactivated authors have no page.
                'author' => $author->is_house || ! $author->is_active ? null : BlogSeo::url("author/{$author->slug}"),
                'tags' => $post->tags->pluck('name')->values()->all(),
            ]),
            jsonLd: $graph->toArray(),
            author: $author->display_name,
            twitterLabels: [
                ['label' => 'Written by', 'data' => $author->display_name],
                ['label' => 'Reading time', 'data' => "{$post->reading_minutes} min"],
            ],
        );
    }

    /**
     * `og:image`: the cover's 1200x630 JPEG crop, else its large variant, else the site default
     * (`BlogSeo::make` supplies that when this returns null). Always absolute, with real dimensions.
     *
     * @return array{url: string, width: int, height: int, alt: string, type: string}|null
     */
    private function image(BlogPost $post): ?array
    {
        $cover = $post->coverImage;
        if ($cover === null) {
            return null;
        }

        $og = $cover->variants['og'] ?? null;
        if (isset($og['path'])) {
            return [
                'url' => SeoData::absoluteUrl((string) BlogImageData::ogUrl($cover)),
                'width' => (int) ($og['width'] ?? 1200),
                'height' => (int) ($og['height'] ?? 630),
                'alt' => (string) ($cover->alt ?: $post->title),
                'type' => 'image/jpeg',
            ];
        }

        $large = BlogImageData::for($cover, 'large');

        return [
            'url' => SeoData::absoluteUrl($large['src']),
            'width' => $large['width'],
            'height' => $large['height'],
            'alt' => (string) ($cover->alt ?: $post->title),
            'type' => str_ends_with(mb_strtolower(parse_url($large['src'], PHP_URL_PATH) ?: ''), '.jpg') ? 'image/jpeg' : 'image/webp',
        ];
    }
}
