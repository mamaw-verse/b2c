<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\ProductVariation;
use Closure;
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

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $product = Product::find($this->input('product_id'));
        $variation = $this->filled('product_variation_id')
            ? ProductVariation::find($this->input('product_variation_id'))
            : null;
        $availableStock = $variation?->stock ?? $product?->stock;

        return [
            'product_id' => ['required', 'string', 'exists:products,id'],
            'product_variation_id' => ['nullable', 'string', 'exists:product_variations,id'],
            'qty' => [
                'sometimes',
                'integer',
                'min:1',
                'max:99',
                function (string $attribute, mixed $value, Closure $fail) use ($availableStock): void {
                    if ($availableStock !== null && $availableStock < 1) {
                        $fail('This product is out of stock.');
                    }
                },
            ],
        ];
    }
}
