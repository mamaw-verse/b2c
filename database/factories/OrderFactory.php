<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Address;
use App\Models\Order;
use App\Models\ShippingOption;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
final class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->numberBetween(20000, 500000);
        $shippingFee = 8000;
        $total = $subtotal + $shippingFee;

        return [
            'user_id' => User::factory(),
            'shop_id' => Shop::factory(),
            'address_id' => Address::factory(),
            'shipping_option_id' => ShippingOption::factory(),
            'voucher_id' => null,
            'platform_voucher_id' => null,
            'payment_method' => PaymentMethod::Cod,
            'status' => OrderStatus::Pending,
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'shipping_discount' => 0,
            'voucher_discount' => 0,
            'platform_voucher_discount' => 0,
            'total' => $total,
            'cod_fee' => 2000,
            'notes' => null,
        ];
    }

    public function toPay(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::ToPay]);
    }

    public function toShip(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::ToShip]);
    }

    public function toReceive(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::ToReceive]);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::Completed]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::Cancelled]);
    }

    public function returnRefund(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::ReturnRefund]);
    }
}
