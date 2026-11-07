<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateConversationRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user() instanceof User ? Response::allow() : Response::deny();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'string', 'exists:shops,id'],
            'initial_message' => ['nullable', 'string', 'max:2000'],
            'product_id' => ['nullable', 'string', 'exists:products,id'],
        ];
    }
}
