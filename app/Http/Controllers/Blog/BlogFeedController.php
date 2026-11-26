<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\BuildBlogFeed;
use Illuminate\Http\Response;

final class BlogFeedController
{
    public function __invoke(BuildBlogFeed $action): Response
    {
        return response($action->handle(), 200, [
            'Content-Type' => 'application/rss+xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=600, s-maxage=600',
        ]);
    }
}
