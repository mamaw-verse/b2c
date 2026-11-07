<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Province;
use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Province>
 */
final class ProvinceFactory extends Factory
{
    protected $model = Province::class;

    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('###000000'),
            'name' => fake()->city(),
            'region_code' => Region::factory(),
        ];
    }
}
