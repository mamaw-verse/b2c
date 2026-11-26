<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\ReassignBlogAuthorPosts;
use App\Http\Requests\Admin\CreateBlogAuthorReassignmentRequest;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogAuthorReassignmentController
{
    public function store(CreateBlogAuthorReassignmentRequest $request, BlogAuthor $author, ReassignBlogAuthorPosts $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $target = $request->target();
        $moved = $action->handle($author, $target, $admin, $request->ip());

        return back()->with('success', $moved === 0
            ? "{$author->display_name} has no posts to reassign."
            : "Moved {$moved} ".($moved === 1 ? 'post' : 'posts')." from {$author->display_name} to {$target->display_name}.");
    }
}
