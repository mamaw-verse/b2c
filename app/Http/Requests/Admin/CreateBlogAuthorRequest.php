<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Concerns\BlogAuthorValidationRules;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class CreateBlogAuthorRequest extends FormRequest
{
    use BlogAuthorValidationRules;

    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:80'],
            'slug' => $this->authorSlugRules(),
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('blog_authors', 'user_id')],
            'consent' => ['nullable', 'boolean'],
            ...$this->authorContentRules(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function authorData(): array
    {
        return collect($this->validated())->except('consent')->all();
    }

    public function consent(): bool
    {
        return $this->boolean('consent');
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $userId = $this->input('user_id');
                if ($validator->errors()->isNotEmpty() || ! is_string($userId) || $userId === '') {
                    return;
                }

                if (! User::query()->find($userId)?->canManageBlog()) {
                    $validator->errors()->add('user_id', 'Only admins and editors can be linked to an author profile.');
                }
            },
        ];
    }
}
