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
     * @return array{display_name: string, slug?: string|null, job_title?: string|null, bio?: string|null, avatar_image_id?: string|null, links?: array<int, array{label: string, url: string}>|null, user_id?: string|null}
     */
    public function authorData(): array
    {
        /** @var array{display_name: string, slug?: string|null, job_title?: string|null, bio?: string|null, avatar_image_id?: string|null, links?: array<int, array{label: string, url: string}>|null, user_id?: string|null} $data */
        $data = collect($this->validated())->except('consent')->all();

        return $data;
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
