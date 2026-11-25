<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateBlogMarkdownPreviewRequest extends FormRequest
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
            'markdown' => ['nullable', 'string', 'max:200000'],
        ];
    }

    public function markdown(): string
    {
        return (string) $this->validated('markdown');
    }
}
