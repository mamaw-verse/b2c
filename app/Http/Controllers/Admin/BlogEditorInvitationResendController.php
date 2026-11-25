<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\Admin\ResendBlogEditorInvitation;
use App\Http\Requests\Admin\CreateBlogEditorInvitationResendRequest;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class BlogEditorInvitationResendController
{
    public function store(CreateBlogEditorInvitationResendRequest $request, BlogEditorInvitation $invitation, ResendBlogEditorInvitation $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle($invitation, $admin, $request->ip());

        return back()->with('success', 'Invitation sent again.');
    }
}
