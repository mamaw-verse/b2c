<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\PublishBlogPost;
use App\Actions\Blog\Admin\UnpublishBlogPost;
use App\Http\Requests\Admin\CreateBlogPostPublicationRequest;
use App\Http\Requests\Admin\DeleteBlogPostPublicationRequest;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogPostPublicationController
{
    public function store(CreateBlogPostPublicationRequest $request, BlogPost $post, PublishBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $post = $action->handle($post, $user, $request->publishedAt(), $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with(
            'success',
            $post->isScheduled() ? 'Post scheduled.' : 'Post published.',
        );
    }

    public function destroy(DeleteBlogPostPublicationRequest $request, BlogPost $post, UnpublishBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($post, $user, $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with('success', 'Post moved back to draft.');
    }
}
