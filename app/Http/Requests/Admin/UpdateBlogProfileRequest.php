<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Concerns\BlogAuthorValidationRules;
use App\Models\BlogAuthor;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

/** An editor (or admin) editing their own linked profile: bio, job title, avatar, links only. */
final class UpdateBlogProfileRequest extends FormRequest
{
    use BlogAuthorValidationRules;

    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user?->canManageBlog()) {
            return Response::denyAsNotFound();
        }

        return $this->author() === null ? Response::denyAsNotFound() : Response::allow();
    }

    public function author(): ?BlogAuthor
    {
        $user = $this->user();

        return $user === null ? null : BlogAuthor::query()->where('user_id', $user->id)->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();

        return $this->authorContentRules($user !== null && ! $user->isAdmin() ? $user->id : null);
    }
}
