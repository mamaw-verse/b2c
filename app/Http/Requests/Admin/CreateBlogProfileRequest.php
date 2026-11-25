<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogAuthor;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

/** "Create my author profile": only for someone who can write but has no profile yet. */
final class CreateBlogProfileRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user?->canManageBlog()) {
            return Response::denyAsNotFound();
        }

        return BlogAuthor::query()->where('user_id', $user->id)->exists()
            ? Response::denyAsNotFound()
            : Response::allow();
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
            'consent.accepted' => 'You need to agree to be credited publicly as an author to create a profile.',
        ];
    }
}
