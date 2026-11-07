<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Address;
use App\Models\CartItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            $address = Address::find($this->input('address_id'));
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
}
