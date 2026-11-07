<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowOrderRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $order = $this->route('order');
        assert($order instanceof Order);

        return $order->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
