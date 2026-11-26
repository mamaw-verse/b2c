<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Support\Blog\BlogSlug;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateBlogCategoryRequest extends FormRequest
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
            'slug' => [
                'nullable', 'string', 'max:100', 'regex:'.BlogSlug::FORMAT,
                Rule::notIn((array) config('blog.reserved_slugs', [])),
                Rule::unique('blog_categories', 'slug'),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'shop_category_id' => ['nullable', 'exists:categories,id'],
        ];
    }

    /**
     * @return array{name: string, slug?: string|null, description?: string|null, sort_order?: int|null, shop_category_id?: string|null}
     */
    public function categoryData(): array
    {
        /** @var array{name: string, slug?: string|null, description?: string|null, sort_order?: int|null, shop_category_id?: string|null} $data */
        $data = $this->validated();

        return $data;
    }
}
