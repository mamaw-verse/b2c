<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Concerns\BlogPostValidationRules;
use App\Models\BlogAuthor;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class CreateBlogPostRequest extends FormRequest
{
    use BlogPostValidationRules;

    public function authorize(): Response
    {
        return $this->user()?->canManageBlog() ? Response::allow() : Response::denyAsNotFound();
    }

    protected function prepareForValidation(): void
    {
        $this->defaultAuthorToOwnProfile();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->postRules();
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if (BlogAuthor::query()->whereKey($this->input('blog_author_id'))->where('is_active', false)->exists()) {
                    $validator->errors()->add('blog_author_id', 'This author is deactivated. Choose an active author.');
                }
            },
        ];
    }
}
