<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ShippingOption;
use Illuminate\Database\Seeder;

final class CartCheckoutSeeder extends Seeder
{
    public function run(): void
    {
        // Shipping options (platform-wide)
        ShippingOption::create([
            'shop_id' => null,
            'name' => 'Standard Delivery',
            'description' => 'Reliable delivery in 3–5 business days.',
            'icon' => 'truck',
            'fee' => 8000,
            'is_cold_chain' => false,
            'is_active' => true,
            'eta_days_min' => 3,
            'eta_days_max' => 5,
        ]);

        ShippingOption::create([
            'shop_id' => null,
            'name' => 'Express Delivery',
            'description' => 'Delivered the next business day if ordered before 2 PM.',
            'icon' => 'clock',
            'fee' => 15000,
            'is_cold_chain' => false,
            'is_active' => true,
            'eta_days_min' => 1,
            'eta_days_max' => 2,
        ]);

        ShippingOption::create([
            'shop_id' => null,
            'name' => 'Cold Chain Delivery',
            'description' => 'Temperature-controlled for frozen halal items.',
            'icon' => 'snowflake',
            'fee' => 22000,
            'is_cold_chain' => true,
            'is_active' => true,
            'eta_days_min' => 2,
            'eta_days_max' => 3,
        ]);
    }
}
