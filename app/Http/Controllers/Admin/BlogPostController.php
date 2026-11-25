<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\CreateBlogPost;
use App\Actions\Blog\Admin\DeleteBlogPost;
use App\Actions\Blog\Admin\ListBlogPosts;
use App\Actions\Blog\Admin\ShowBlogPostForm;
use App\Actions\Blog\Admin\UpdateBlogPost;
use App\Http\Requests\Admin\CreateBlogPostRequest;
use App\Http\Requests\Admin\DeleteBlogPostRequest;
use App\Http\Requests\Admin\EditBlogPostRequest;
use App\Http\Requests\Admin\ListBlogPostsRequest;
use App\Http\Requests\Admin\ShowNewBlogPostRequest;
use App\Http\Requests\Admin\UpdateBlogPostRequest;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class BlogPostController
{
    public function index(ListBlogPostsRequest $request, ListBlogPosts $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        return Inertia::render('admin/blog/posts', $action->handle($user, $request->filters()));
    }

    public function create(ShowNewBlogPostRequest $request, ShowBlogPostForm $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        return Inertia::render('admin/blog/post-form', $action->handle($user));
    }

    public function store(CreateBlogPostRequest $request, CreateBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $post = $action->handle($user, $request->postData(), $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with('success', 'Draft saved.');
    }

    public function edit(EditBlogPostRequest $request, BlogPost $post, ShowBlogPostForm $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        return Inertia::render('admin/blog/post-form', $action->handle($user, $post));
    }

    public function update(UpdateBlogPostRequest $request, BlogPost $post, UpdateBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($post, $user, $request->postData(), $request->ip());

        return redirect()->route('admin.blog.posts.edit', $post)->with('success', 'Post saved.');
    }

    public function destroy(DeleteBlogPostRequest $request, BlogPost $post, DeleteBlogPost $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($post, $user, $request->ip());

        return redirect()->route('admin.blog.posts.index')->with('success', 'Post deleted.');
    }
}
