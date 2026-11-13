<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\CartItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): Response
    {
        $item = $this->route('cart');
        if (! $item instanceof CartItem) {
            return Response::denyAsNotFound();
        }

        return $item->user_id === $this->user()?->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $cartItem = $this->route('cart');
        $productId = $cartItem instanceof CartItem ? $cartItem->product_id : null;

        return [
            'qty' => ['required_without:product_variation_id', 'integer', 'min:1', 'max:99'],
            'product_variation_id' => [
                'sometimes',
                'string',
                Rule::exists('product_variations', 'id')->where('product_id', $productId),
            ],
        ];
    }
}
