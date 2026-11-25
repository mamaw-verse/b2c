<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\BlogCategory;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;

final readonly class BuildBlogCategorySeoData
{
    /**
     * @param  array{current_page: int, last_page: int, total: int}  $meta
     */
    public function handle(BlogCategory $category, array $meta): SeoData
    {
        $path = "category/{$category->slug}";
        $paging = BlogSeo::paging($path, $meta);

        // Real copy only; otherwise a sentence built from real counts (plan §8).
        $description = mb_trim((string) $category->description) !== ''
            ? mb_trim((string) $category->description)
            : "Read {$meta['total']} halal shopping ".($meta['total'] === 1 ? 'story' : 'stories')." in {$category->name} on the HalalBenta Blog.";

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($paging['canonical'], [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => config()->string('blog.title', 'HalalBenta Blog'), 'url' => BlogSeo::url()],
            ['name' => $category->name, 'url' => BlogSeo::url($path)],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'CollectionPage',
                url: $paging['canonical'],
                name: $category->name,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
            ))
            ->add($breadcrumb);

        return BlogSeo::make(
            title: BlogSeo::title($category->name).$paging['suffix'],
            description: $description,
            canonical: $paging['canonical'],
            robots: BlogSeo::robots(! $paging['beyond_last'] && $meta['total'] > 0),
            jsonLd: $graph->toArray(),
            prev: $paging['prev'],
            next: $paging['next'],
        );
    }
}
