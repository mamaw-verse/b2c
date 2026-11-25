<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateBlogPostFeaturedRequest extends FormRequest
{
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
            'is_featured' => ['required', 'boolean'],
        ];
    }

    public function featured(): bool
    {
        return $this->boolean('is_featured');
    }
}
