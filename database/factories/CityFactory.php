<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\City;
use App\Models\Province;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<City>
 */
final class CityFactory extends Factory
{
    protected $model = City::class;

    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('######000'),
            'name' => fake()->city(),
            'province_code' => Province::factory(),
            'is_municipality' => fake()->boolean(30),
        ];
    }
}
