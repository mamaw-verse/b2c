<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowCategoryRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'sort' => ['sometimes', 'in:relevant,newest,top_sales,price_asc,price_desc'],
        ];
    }

    public function sort(): string
    {
        return $this->validated('sort', 'relevant');
    }
}
