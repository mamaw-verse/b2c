<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class DeleteCategoryRequest extends FormRequest
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
                assert($category instanceof Category);

                if ($category->products()->exists()) {
                    $validator->errors()->add('category', 'This category still has products and cannot be deleted.');
                }

                if ($category->children()->exists()) {
                    $validator->errors()->add('category', 'This category still has subcategories and cannot be deleted.');
                }
            },
        ];
    }
}
