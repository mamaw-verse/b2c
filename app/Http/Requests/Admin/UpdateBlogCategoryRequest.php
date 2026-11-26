<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateBlogCategoryRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'shop_category_id' => ['nullable', 'exists:categories,id'],
        ];
    }

    /**
     * @return array{name: string, description?: string|null, sort_order?: int|null, shop_category_id?: string|null}
     */
    public function categoryData(): array
    {
        /** @var array{name: string, description?: string|null, sort_order?: int|null, shop_category_id?: string|null} $data */
        $data = $this->validated();

        return $data;
    }
}
