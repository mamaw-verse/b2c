<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\HalalCertification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HalalCertification>
 */
final class HalalCertificationFactory extends Factory
{
    protected $model = HalalCertification::class;

    public function definition(): array
    {
        return [
            'certifying_body' => fake()->randomElement(['Islamic Da’wah Council of the Philippines (IDCP)', 'Halal Development Institute of the Philippines (HDIP)', 'Mindanao Halal Authority (MinHA)']),
            'number' => 'HC-'.fake()->year().'-'.fake()->numerify('#####'),
            'scope' => 'Product and packing facility',
            'valid_until' => fake()->dateTimeBetween('+6 months', '+3 years'),
            'checked_at' => now(),
        ];
    }
}
