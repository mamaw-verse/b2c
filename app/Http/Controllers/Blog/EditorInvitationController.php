<?php

declare(strict_types=1);

namespace App\Http\Controllers\Blog;

use App\Actions\Blog\Admin\AcceptBlogEditorInvitation;
use App\Http\Requests\Blog\ShowEditorInvitationRequest;
use App\Http\Requests\Blog\UpdateEditorInvitationRequest;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use App\Support\Blog\BlogConsentCopy;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class EditorInvitationController
{
    public function show(ShowEditorInvitationRequest $request, BlogEditorInvitation $invitation): Response|RedirectResponse
    {
        if (! $request->isUsable()) {
            return Inertia::render('account/editor-invitation', ['invitation' => null, 'consent' => null]);
        }

        if ($request->user() === null) {
            session()->put('url.intended', $request->fullUrl());

            $hasAccount = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($invitation->email)])->exists();
            if ($hasAccount) {
                return redirect()->route('login', ['email' => $invitation->email])
                    ->with('status', 'Please log in to view and accept your editor invitation.');
            }

            session()->put('editor_invitation_id', $invitation->id);

            return redirect()->route('register', ['email' => $invitation->email]);
        }

        return Inertia::render('account/editor-invitation', [
            'invitation' => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
            'consent' => [...BlogConsentCopy::editorInvitation(), 'version' => BlogConsentCopy::version()],
        ]);
    }

    public function update(UpdateEditorInvitationRequest $request, BlogEditorInvitation $invitation, AcceptBlogEditorInvitation $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($invitation, $user, $request->ip());

        return redirect()->route('admin.blog.posts.index')->with('success', 'Welcome to the editorial team! Your author profile is ready.');
    }
}
