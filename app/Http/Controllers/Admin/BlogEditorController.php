<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\ListBlogEditors;
use App\Actions\Blog\Admin\RemoveBlogEditor;
use App\Http\Requests\Admin\DeleteBlogEditorRequest;
use App\Http\Requests\Admin\ListBlogEditorsRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class BlogEditorController
{
    public function index(ListBlogEditorsRequest $request, ListBlogEditors $action): Response
    {
        return Inertia::render('admin/blog/editors', $action->handle());
    }

    public function destroy(DeleteBlogEditorRequest $request, User $editor, RemoveBlogEditor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($editor, $admin, $request->ip());

        return back()->with('success', 'Editor removed. Their posts stay online under their author profile.');
    }
}
