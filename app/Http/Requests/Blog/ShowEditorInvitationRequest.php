<?php

declare(strict_types=1);

namespace App\Http\Requests\Blog;

use App\Models\BlogEditorInvitation;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The invitation page never reveals whether a link is expired, revoked, for someone else or
 * whether an email has an account: every unusable case renders the same neutral page.
 */
final class ShowEditorInvitationRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }

    public function invitation(): BlogEditorInvitation
    {
        $invitation = $this->route('invitation');
        assert($invitation instanceof BlogEditorInvitation);

        return $invitation;
    }

    public function isUsable(): bool
    {
        $invitation = $this->invitation();
        if (! $invitation->isPending()) {
            return false;
        }

        $user = $this->user();

        return ! $user instanceof User || self::mayAccept($user, $invitation);
    }

    /** Whether the signed-in user is the invitee and is eligible to become an editor. */
    public static function mayAccept(User $user, BlogEditorInvitation $invitation): bool
    {
        return mb_strtolower($user->email) === mb_strtolower($invitation->email)
            && ! $user->canManageBlog()
            && ! $user->isSuspended();
    }
}
