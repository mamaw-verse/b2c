<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\DeactivateBlogAuthor;
use App\Actions\Blog\Admin\ReactivateBlogAuthor;
use App\Http\Requests\Admin\CreateBlogAuthorDeactivationRequest;
use App\Http\Requests\Admin\DeleteBlogAuthorDeactivationRequest;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogAuthorDeactivationController
{
    public function store(CreateBlogAuthorDeactivationRequest $request, BlogAuthor $author, DeactivateBlogAuthor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($author, $admin, $request->ip());

        return back()->with('success', 'Author deactivated. Existing posts stay credited to them.');
    }

    public function destroy(DeleteBlogAuthorDeactivationRequest $request, BlogAuthor $author, ReactivateBlogAuthor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($author, $admin, $request->ip());

        return back()->with('success', 'Author reactivated.');
    }
}
