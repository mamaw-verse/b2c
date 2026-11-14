<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AffiliateEarningStatus;
use App\Models\AffiliateEarning;
use App\Models\AffiliateProfile;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AffiliateEarning>
 */
final class AffiliateEarningFactory extends Factory
{
    protected $model = AffiliateEarning::class;

    public function definition(): array
    {
        return [
            'affiliate_profile_id' => AffiliateProfile::factory(),
            'order_id' => Order::factory(),
            'order_item_id' => OrderItem::factory(),
            'amount' => 5000,
            'status' => AffiliateEarningStatus::Pending->value,
            'available_at' => now()->addDays(7),
        ];
    }

    public function available(): static
    {
        return $this->state(fn () => [
            'status' => AffiliateEarningStatus::Available->value,
            'available_at' => now()->subDay(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => AffiliateEarningStatus::Cancelled->value,
        ]);
    }
}
