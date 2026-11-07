<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateCartItemRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user() !== null
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'string', 'exists:products,id'],
            'product_variation_id' => ['nullable', 'string', 'exists:product_variations,id'],
            'qty' => ['sometimes', 'integer', 'min:1', 'max:99'],
        ];
    }
}
