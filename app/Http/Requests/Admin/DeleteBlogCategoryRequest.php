<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogCategory;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class DeleteBlogCategoryRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $category = $this->route('category');
                assert($category instanceof BlogCategory);

                if ($category->is_system) {
                    $validator->errors()->add('category', 'This is a system category and cannot be deleted.');
                }

                // Soft-deleted posts still hold the foreign key, so count them too.
                if ($category->posts()->withTrashed()->exists()) {
                    $validator->errors()->add('category', 'This category still has posts and cannot be deleted.');
                }
            },
        ];
    }
}
