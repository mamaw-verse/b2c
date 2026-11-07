<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateCartSelectionRequest extends FormRequest
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
            'item_ids' => ['required', 'array'],
            'item_ids.*' => ['string', 'exists:cart_items,id'],
            'selected' => ['required', 'boolean'],
        ];
    }
}
