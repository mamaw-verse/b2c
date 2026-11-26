<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Concerns\BlogAuthorValidationRules;
use App\Models\BlogAuthor;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateBlogAuthorRequest extends FormRequest
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
        $author = $this->author();

        return [
            'display_name' => ['required', 'string', 'max:80'],
            // The slug is part of public URLs, so it only changes when an admin sends a new one.
            'slug' => $this->authorSlugRules($author),
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('blog_authors', 'user_id')->ignore($author->id)],
            'consent' => ['nullable', 'boolean'],
            ...$this->authorContentRules(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function authorData(): array
    {
        $data = collect($this->validated())->except('consent');

        // An empty slug field means "leave it alone", not "generate a new one".
        if (! $this->filled('slug')) {
            $data->forget('slug');
        }

        // The house author is not a person: it never links to a user.
        if ($this->author()->is_house) {
            $data->forget('user_id');
        }

        return $data->all();
    }

    public function consent(): bool
    {
        return $this->boolean('consent') && ! $this->author()->is_house;
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

    private function author(): BlogAuthor
    {
        $author = $this->route('author');
        assert($author instanceof BlogAuthor);

        return $author;
    }
}
