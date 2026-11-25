<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogEditorInvitation;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteBlogEditorInvitationRequest extends FormRequest
{
    public function authorize(): Response
    {
        if (! $this->user()?->isAdmin()) {
            return Response::denyAsNotFound();
        }

        $invitation = $this->route('invitation');

        // An accepted or already revoked invitation has nothing left to revoke.
        return $invitation instanceof BlogEditorInvitation
            && $invitation->accepted_at === null
            && $invitation->revoked_at === null
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
