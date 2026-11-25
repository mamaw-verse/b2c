<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\ShowBlogPostPreview;
use App\Http\Requests\Admin\ShowBlogPostPreviewRequest;
use App\Models\BlogPost;
use Inertia\Inertia;
use Inertia\Response;

final class BlogPostPreviewController
{
    public function show(ShowBlogPostPreviewRequest $request, BlogPost $post, ShowBlogPostPreview $action): Response
    {
        return Inertia::render('admin/blog/post-preview', $action->handle($post));
    }
}
