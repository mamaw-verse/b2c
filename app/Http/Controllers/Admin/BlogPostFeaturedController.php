<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\SetBlogPostFeatured;
use App\Http\Requests\Admin\UpdateBlogPostFeaturedRequest;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogPostFeaturedController
{
    public function update(UpdateBlogPostFeaturedRequest $request, BlogPost $post, SetBlogPostFeatured $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($post, $admin, $request->featured(), $request->ip());

        return back()->with('success', $request->featured() ? 'Post featured.' : 'Post no longer featured.');
    }
}
