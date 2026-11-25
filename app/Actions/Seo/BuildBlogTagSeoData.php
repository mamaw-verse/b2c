<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\BlogTag;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;

final readonly class BuildBlogTagSeoData
{
    /** A tag page is thin content until it lists at least this many posts (plan §4.2). */
    public const int MIN_POSTS_TO_INDEX = 3;

    /**
     * @param  array{current_page: int, last_page: int, total: int}  $meta
     */
    public function handle(BlogTag $tag, array $meta): SeoData
    {
        $path = "tag/{$tag->slug}";
        $paging = BlogSeo::paging($path, $meta);
        $description = "Stories tagged {$tag->name} on the HalalBenta Blog ({$meta['total']} ".($meta['total'] === 1 ? 'story' : 'stories').').';

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($paging['canonical'], [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => config()->string('blog.title', 'HalalBenta Blog'), 'url' => BlogSeo::url()],
            ['name' => $tag->name, 'url' => BlogSeo::url($path)],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'CollectionPage',
                url: $paging['canonical'],
                name: $tag->name,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
            ))
            ->add($breadcrumb);

        return BlogSeo::make(
            title: BlogSeo::title($tag->name).$paging['suffix'],
            description: $description,
            canonical: $paging['canonical'],
            robots: BlogSeo::robots($meta['total'] >= self::MIN_POSTS_TO_INDEX && ! $paging['beyond_last']),
            jsonLd: $graph->toArray(),
            prev: $paging['prev'],
            next: $paging['next'],
        );
    }
}
