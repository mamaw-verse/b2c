<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\ShowBlogAuthor;
use App\Actions\Seo\BuildBlogAuthorSeoData;
use App\Models\BlogAuthor;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class BlogAuthorController
{
    public function show(BlogAuthor $blogAuthor, ShowBlogAuthor $show, BuildBlogAuthorSeoData $buildSeoData, Seo $seo): Response
    {
        $data = $show->handle($blogAuthor);

        $seoData = $buildSeoData->handle($blogAuthor, $data['posts']['meta']);
        $seo->set($seoData);

        return Inertia::render('blog/author', $data)->withViewData(['seo' => $seoData]);
    }
}
