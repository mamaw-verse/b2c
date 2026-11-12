<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowSellerCustomerRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User || ! $user->isSeller()) {
            return Response::denyAsNotFound();
        }

        $shop = $user->shop;
        if ($shop === null) {
            return Response::denyAsNotFound();
        }

        $customer = $this->route('customer');
        if (! $customer instanceof User) {
            return Response::denyAsNotFound();
        }

        $hasOrder = Order::query()
            ->where('shop_id', $shop->id)
            ->where('user_id', $customer->id)
            ->where('status', '!=', OrderStatus::Cancelled)
            ->exists();

        return $hasOrder ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
