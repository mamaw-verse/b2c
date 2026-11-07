<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateCartVoucherRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50'],
            'cart_item_ids' => ['sometimes', 'array'],
            'cart_item_ids.*' => ['string', 'exists:cart_items,id'],
        ];
    }
}
