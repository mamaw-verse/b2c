<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Address;
use App\Models\CartItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class CreateCheckoutRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if ($user === null) {
            return Response::denyAsNotFound();
        }

        $hasSelected = CartItem::where('user_id', $user->id)
            ->where('selected', true)
            ->exists();

        if (! $hasSelected) {
            return Response::deny('Cart has no selected items for checkout.');
        }

        if ($this->has('address_id')) {
            $address = Address::whereKey($this->input('address_id'))->first();
            if ($address !== null && $address->user_id !== $user->id) {
                return Response::denyAsNotFound();
            }
        }

        return Response::allow();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'address_id' => ['required', 'string', 'exists:addresses,id'],
            'shipping_option_id' => ['required', 'string', 'exists:shipping_options,id'],
            'payment_method' => ['required', 'string', Rule::enum(PaymentMethod::class)],
            'shop_voucher_id' => ['nullable', 'string', 'exists:vouchers,id'],
            'platform_voucher_id' => ['nullable', 'string', 'exists:vouchers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $ownShopItem = CartItem::with('product.shop')
                ->where('user_id', $this->user()->id)
                ->where('selected', true)
                ->get()
                ->first(fn (CartItem $item) => $item->product->shop->user_id === $this->user()->id);

            if ($ownShopItem !== null) {
                $validator->errors()->add(
                    'cart',
                    'You cannot check out items from your own shop.',
                );
            }

            $outOfStock = CartItem::with(['product', 'variation'])
                ->where('user_id', $this->user()->id)
                ->where('selected', true)
                ->get()
                ->first(fn (CartItem $item) => ! $item->product->published
                    || ! $item->product->halal_status->visibleToBuyers()
                    || ($item->variation->stock ?? $item->product->stock) < $item->qty);

            if ($outOfStock !== null) {
                $validator->errors()->add(
                    'cart',
                    "Product \"{$outOfStock->product->name}\" is out of stock.",
                );
            }
        });
    }
}
