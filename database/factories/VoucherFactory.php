<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\DiscountType;
use App\Enums\VoucherKind;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Voucher>
 */
final class VoucherFactory extends Factory
{
    protected $model = Voucher::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'code' => mb_strtoupper(fake()->unique()->lexify('????####')),
            'kind' => VoucherKind::Platform,
            'discount_type' => DiscountType::Fixed,
            'discount_value' => fake()->randomElement([5000, 10000, 15000, 20000]),
            'max_discount' => null,
            'min_spend' => fake()->randomElement([0, 30000, 50000, 80000]),
            'max_uses' => null,
            'used_count' => 0,
            'starts_at' => Carbon::now()->subDay(),
            'expires_at' => Carbon::now()->addDays(30),
            'is_active' => true,
        ];
    }

    public function shopVoucher(): static
    {
        return $this->state(['kind' => VoucherKind::Shop]);
    }

    public function shippingVoucher(): static
    {
        return $this->state([
            'kind' => VoucherKind::Shipping,
            'discount_type' => DiscountType::Fixed,
            'discount_value' => 8000,
        ]);
    }

    public function expired(): static
    {
        return $this->state([
            'expires_at' => Carbon::now()->subDays(5),
            'is_active' => true,
        ]);
    }
}
