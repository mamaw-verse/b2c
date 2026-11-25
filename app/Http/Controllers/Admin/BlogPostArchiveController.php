<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\ArchiveBlogPost;
use App\Actions\Blog\Admin\RestoreBlogPost;
use App\Http\Requests\Admin\CreateBlogPostArchiveRequest;
use App\Http\Requests\Admin\DeleteBlogPostArchiveRequest;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogPostArchiveController
{
    public function store(CreateBlogPostArchiveRequest $request, BlogPost $post, ArchiveBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($post, $user, $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with('success', 'Post archived.');
    }

    public function destroy(DeleteBlogPostArchiveRequest $request, BlogPost $post, RestoreBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($post, $user, $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with('success', 'Post restored as a draft.');
    }
}
