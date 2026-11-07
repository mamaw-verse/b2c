<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateMessageRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::deny();
        }

        $conversation = $this->route('conversation');
        if (! $conversation instanceof Conversation) {
            return Response::denyAsNotFound();
        }

        $isBuyer = $conversation->user_id === $user->id;
        $isSeller = $conversation->shop->user_id === $user->id;

        return ($isBuyer || $isSeller) ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'in:text,product,order,system'],
            'body' => ['nullable', 'string', 'max:2000'],
            'product_id' => ['nullable', 'string', 'exists:products,id'],
            'order_id' => ['nullable', 'string', 'exists:orders,id'],
        ];
    }
}
