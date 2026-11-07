<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListSearchResultsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:100'],
            'halal' => ['sometimes', 'boolean'],
            'free_shipping' => ['sometimes', 'boolean'],
            'frozen' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'in:relevant,newest,top_sales,price_asc,price_desc'],
        ];
    }

    /** @return array{q?: string, halal?: bool, free_shipping?: bool, frozen?: bool, sort?: string} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'q' => $data['q'] ?? '',
            'halal' => filter_var($data['halal'] ?? true, FILTER_VALIDATE_BOOL),
            'free_shipping' => filter_var($data['free_shipping'] ?? false, FILTER_VALIDATE_BOOL),
            'frozen' => filter_var($data['frozen'] ?? false, FILTER_VALIDATE_BOOL),
            'sort' => $data['sort'] ?? 'relevant',
        ];
    }
}
