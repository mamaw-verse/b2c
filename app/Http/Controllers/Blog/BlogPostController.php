<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\RecordBlogPostView;
use App\Actions\Blog\ShowBlogPost;
use App\Actions\Seo\BuildBlogPostSeoData;
use App\Models\BlogPost;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BlogPostController
{
    public function show(Request $request, BlogPost $blogPost, ShowBlogPost $show, RecordBlogPostView $recordView, BuildBlogPostSeoData $buildSeoData, Seo $seo): Response
    {
        // `ShowBlogPost` loads the relations the SEO builder also reads.
        $props = $show->handle($blogPost);

        // Bots, HEAD and prefetch requests are ignored; one count per session, post and day.
        $recordView->handle($blogPost, $request);

        $seoData = $buildSeoData->handle($blogPost);
        $seo->set($seoData);

        return Inertia::render('blog/show', $props)->withViewData(['seo' => $seoData]);
    }
}
