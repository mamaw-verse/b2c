<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Barangay;
use App\Models\City;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Barangay>
 */
final class BarangayFactory extends Factory
{
    protected $model = Barangay::class;

    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('#########'),
            'name' => 'Barangay '.fake()->lastName(),
            'city_code' => City::factory(),
        ];
    }
}
