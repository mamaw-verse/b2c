<?php

declare(strict_types=1);

namespace App\Http\Requests\Blog;

use App\Models\BlogEditorInvitation;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateEditorInvitationRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        $invitation = $this->route('invitation');

        if (! $user instanceof User || ! $invitation instanceof BlogEditorInvitation) {
            return Response::denyAsNotFound();
        }

        return $invitation->isPending() && ShowEditorInvitationRequest::mayAccept($user, $invitation)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'consent' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'consent.accepted' => 'You need to agree to be credited publicly as an author to continue.',
        ];
    }
}
