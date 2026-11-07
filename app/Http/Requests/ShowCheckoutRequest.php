<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\CartItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowCheckoutRequest extends FormRequest
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

        return $hasSelected
            ? Response::allow()
            : Response::deny('Cart has no selected items for checkout.');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
