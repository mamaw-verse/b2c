<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\InviteBlogEditor;
use App\Actions\Blog\Admin\RevokeBlogEditorInvitation;
use App\Http\Requests\Admin\CreateBlogEditorInvitationRequest;
use App\Http\Requests\Admin\DeleteBlogEditorInvitationRequest;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogEditorInvitationController
{
    public function store(CreateBlogEditorInvitationRequest $request, InviteBlogEditor $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($admin, $request->email(), $request->ip());

        return back()->with('success', 'Invitation sent.');
    }

    public function destroy(DeleteBlogEditorInvitationRequest $request, BlogEditorInvitation $invitation, RevokeBlogEditorInvitation $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($invitation, $admin, $request->ip());

        return back()->with('success', 'Invitation revoked.');
    }
}
