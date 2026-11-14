<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateSellerOrderChatRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        $order = $this->route('order');
        assert($order instanceof Order);

        $operatedShop = $user->operatedShop();

        return ($operatedShop !== null && ! $operatedShop->suspended && $operatedShop->id === $order->shop_id)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
