<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogImage;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListBlogImagesRequest extends FormRequest
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
            'purpose' => ['nullable', Rule::in(BlogImage::PURPOSES)],
        ];
    }

    public function purpose(): ?string
    {
        return $this->validated('purpose');
    }
}
