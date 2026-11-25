<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\ListBlogTagPosts;
use App\Actions\Seo\BuildBlogTagSeoData;
use App\Models\BlogTag;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class BlogTagController
{
    public function show(BlogTag $blogTag, ListBlogTagPosts $posts, BuildBlogTagSeoData $buildSeoData, Seo $seo): Response
    {
        $page = $posts->handle($blogTag);

        $seoData = $buildSeoData->handle($blogTag, $page['meta']);
        $seo->set($seoData);

        return Inertia::render('blog/index', [
            'mode' => 'tag',
            'heading' => $blogTag->name,
            'intro' => null,
            'slug' => $blogTag->slug,
            'q' => null,
            'active_category' => null,
            'categories' => [],
            'hero' => [],
            'popular' => [],
            'posts' => $page,
            'total_live' => $page['meta']['total'],
        ])->withViewData(['seo' => $seoData]);
    }
}
