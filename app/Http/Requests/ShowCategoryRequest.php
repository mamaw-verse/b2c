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
        return [];
    }

    public function sort(): string
    {
        $sort = $this->query('sort', 'top_sales');

        return in_array($sort, ['newest', 'top_sales', 'price_asc', 'price_desc'], true)
            ? $sort
            : 'top_sales';
    }

    public function halalOnly(): bool
    {
        return $this->boolean('halal');
    }
}
