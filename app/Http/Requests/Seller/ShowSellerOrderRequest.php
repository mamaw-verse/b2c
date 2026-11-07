<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowSellerOrderRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $order = $this->route('order');
        assert($order instanceof Order);

        return ($user->isSeller() && $user->shop && $order->shop_id === $user->shop->id)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
