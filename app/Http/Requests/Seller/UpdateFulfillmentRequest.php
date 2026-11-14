<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\Fulfillment;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateFulfillmentRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        $order = $this->route('order');
        assert($order instanceof Order);

        $fulfillment = $this->route('fulfillment');
        assert($fulfillment instanceof Fulfillment);

        $operatedShop = $user->operatedShop();

        return ($operatedShop !== null && ! $operatedShop->suspended && $order->shop_id === $operatedShop->id && $fulfillment->order_id === $order->id && $fulfillment->status === 'shipped')
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'courier_name' => ['required', 'string', 'max:100'],
            'tracking_number' => ['required', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'url', 'max:255'],
        ];
    }
}
