<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\ListBlogCategoryChips;
use App\Actions\Blog\ListBlogCategoryPosts;
use App\Actions\Seo\BuildBlogCategorySeoData;
use App\Models\BlogCategory;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class BlogCategoryController
{
    public function show(BlogCategory $blogCategory, ListBlogCategoryPosts $posts, ListBlogCategoryChips $chips, BuildBlogCategorySeoData $buildSeoData, Seo $seo): Response
    {
        $page = $posts->handle($blogCategory);

        $seoData = $buildSeoData->handle($blogCategory, $page['meta']);
        $seo->set($seoData);

        $intro = mb_trim((string) $blogCategory->description);

        return Inertia::render('blog/index', [
            'mode' => 'category',
            'heading' => $blogCategory->name,
            // Real copy only: blank until the admin writes it (same rule as the shop's category intro).
            'intro' => $intro === '' ? null : $intro,
            'slug' => $blogCategory->slug,
            'q' => null,
            'active_category' => $blogCategory->slug,
            'categories' => $chips->handle(),
            'hero' => [],
            'popular' => [],
            'posts' => $page,
            'total_live' => $page['meta']['total'],
        ])->withViewData(['seo' => $seoData]);
    }
}
