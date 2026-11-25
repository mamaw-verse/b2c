<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\CreateBlogAuthor;
use App\Actions\Blog\Admin\ListBlogAuthors;
use App\Actions\Blog\Admin\UpdateBlogAuthor;
use App\Http\Requests\Admin\CreateBlogAuthorRequest;
use App\Http\Requests\Admin\ListBlogAuthorsRequest;
use App\Http\Requests\Admin\UpdateBlogAuthorRequest;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class BlogAuthorController
{
    public function index(ListBlogAuthorsRequest $request, ListBlogAuthors $action): Response
    {
        return Inertia::render('admin/blog/authors', $action->handle());
    }

    public function store(CreateBlogAuthorRequest $request, CreateBlogAuthor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($admin, $request->authorData(), $request->consent(), $request->ip());

        return redirect()->route('admin.blog.authors.index')->with('success', 'Author created.');
    }

    public function update(UpdateBlogAuthorRequest $request, BlogAuthor $author, UpdateBlogAuthor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($author, $admin, $request->authorData(), $request->consent(), $request->ip());

        return redirect()->route('admin.blog.authors.index')->with('success', 'Author updated.');
    }
}
