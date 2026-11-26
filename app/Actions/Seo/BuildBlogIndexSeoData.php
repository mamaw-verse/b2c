<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBlogNode;
use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildItemListNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Support\Blog\BlogSeo;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

/**
 * SEO for `/blog`. Search results (`?q=`), pages beyond the last and an empty blog are `noindex, follow`.
 * Phase 3 adds the `Blog` JSON-LD node and the validator rules (docs/planning/15-blog.md B3.1).
 */
final readonly class BuildBlogIndexSeoData
{
    /**
     * @param  array{current_page: int, last_page: int, total: int}  $meta
     * @param  list<array{slug: string, title: string, image: array{src: string}|null}>  $cards  Posts on this page (stubs in the `ItemList`).
     */
    public function handle(array $meta, ?string $term = null, array $cards = []): SeoData
    {
        $paging = BlogSeo::paging('', $meta);
        $blogTitle = config()->string('blog.title', 'HalalBenta Blog');

        $title = $blogTitle.' – halal shopping guides, recipes and tips'.$paging['suffix'];
        $intro = mb_trim(config()->string('blog.intro', ''));
        $description = $intro !== '' ? $intro : 'Halal shopping guides, recipes, seasonal ideas and tips from the HalalBenta marketplace in the Philippines.';

        $indexable = $term === null && ! $paging['beyond_last'] && $meta['total'] > 0;
        // Search results canonicalise to the clean blog URL; they are noindexed anyway.
        $canonical = $term === null ? $paging['canonical'] : BlogSeo::url();

        $origin = SeoData::canonicalOrigin();
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => $blogTitle, 'url' => BlogSeo::url()],
        ]);

        // Search results list different posts per query, so only the unfiltered listing declares them.
        $listed = $term === null ? $cards : [];

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'CollectionPage',
                url: $canonical,
                name: $blogTitle,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                extra: ['mainEntity' => SchemaGraph::ref(SchemaId::blog())],
            ))
            ->add($breadcrumb)
            ->add(resolve(BuildBlogNode::class)->handle(
                $blogTitle,
                $description,
                array_column($listed, 'slug'),
            ));

        if ($listed !== []) {
            $graph->add(resolve(BuildItemListNode::class)->handle($canonical, array_map(static fn (array $card): array => [
                'url' => BlogSeo::url($card['slug']),
                'name' => $card['title'],
                'image' => $card['image'] === null ? null : SeoData::absoluteUrl($card['image']['src']),
                'type' => 'BlogPosting',
                'id' => SchemaId::blogPost($card['slug']),
            ], $listed)));
        }

        return BlogSeo::make(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: BlogSeo::robots($indexable),
            jsonLd: $graph->toArray(),
            prev: $term === null ? $paging['prev'] : null,
            next: $term === null ? $paging['next'] : null,
        );
    }
}
