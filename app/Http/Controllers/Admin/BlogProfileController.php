<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\CreateOwnBlogAuthorProfile;
use App\Actions\Blog\Admin\ShowBlogProfile;
use App\Actions\Blog\Admin\UpdateBlogAuthor;
use App\Http\Requests\Admin\CreateBlogProfileRequest;
use App\Http\Requests\Admin\ShowBlogProfileRequest;
use App\Http\Requests\Admin\UpdateBlogProfileRequest;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class BlogProfileController
{
    public function edit(ShowBlogProfileRequest $request, ShowBlogProfile $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        return Inertia::render('admin/blog/profile', $action->handle($user));
    }

    public function store(CreateBlogProfileRequest $request, CreateOwnBlogAuthorProfile $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $request->ip());

        return redirect()->route('admin.blog.profile.edit')->with('success', 'Author profile created.');
    }

    public function update(UpdateBlogProfileRequest $request, UpdateBlogAuthor $action): RedirectResponse
    {
        $user = $request->user();
        $author = $request->author();
        assert($user instanceof User && $author instanceof BlogAuthor);

        $action->handle($author, $user, $request->validated(), false, $request->ip());

        return redirect()->route('admin.blog.profile.edit')->with('success', 'Profile saved.');
    }
}
