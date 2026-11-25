<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\BlogAuthor;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;

final readonly class BuildBlogAuthorSeoData
{
    /**
     * An author page is `noindex, follow` until the author has a live post (plan §4.2).
     *
     * @param  array{current_page: int, last_page: int, total: int}  $meta
     */
    public function handle(BlogAuthor $author, array $meta): SeoData
    {
        $path = "author/{$author->slug}";
        $paging = BlogSeo::paging($path, $meta);

        $bio = mb_trim((string) $author->bio);
        $description = $bio !== ''
            ? $bio
            : "Read {$meta['total']} ".($meta['total'] === 1 ? 'story' : 'stories')." by {$author->display_name} on the HalalBenta Blog.";

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($paging['canonical'], [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => config()->string('blog.title', 'HalalBenta Blog'), 'url' => BlogSeo::url()],
            ['name' => $author->display_name, 'url' => BlogSeo::url($path)],
        ]);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'ProfilePage',
                url: $paging['canonical'],
                name: $author->display_name,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
            ))
            ->add($breadcrumb);

        return BlogSeo::make(
            title: BlogSeo::title($author->display_name).$paging['suffix'],
            description: mb_substr($description, 0, 160),
            canonical: $paging['canonical'],
            robots: BlogSeo::robots($meta['total'] > 0 && ! $paging['beyond_last']),
            jsonLd: $graph->toArray(),
            prev: $paging['prev'],
            next: $paging['next'],
        );
    }
}
