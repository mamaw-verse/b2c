<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\CartItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

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

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'qty' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }
}
