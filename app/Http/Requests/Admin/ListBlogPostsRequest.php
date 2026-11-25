<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListBlogPostsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->canManageBlog() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['draft', 'scheduled', 'published', 'archived'])],
            'category' => ['nullable', 'string', 'max:26'],
            'author' => ['nullable', 'string', 'max:26'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array{status: ?string, category: ?string, author: ?string, q: ?string}
     */
    public function filters(): array
    {
        return [
            'status' => $this->validated('status'),
            'category' => $this->validated('category'),
            'author' => $this->validated('author'),
            'q' => $this->validated('q'),
        ];
    }
}
