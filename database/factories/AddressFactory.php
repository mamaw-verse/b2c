<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AddressLabel;
use App\Models\Address;
use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;
use App\Models\Region;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
final class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        $phFirstNames = ['Maria', 'Jose', 'Juan', 'Ana', 'Rizal', 'Luisa', 'Ramon', 'Carina'];
        $phLastNames = ['Santos', 'Reyes', 'Cruz', 'Dela Cruz', 'Garcia', 'Mendoza', 'Lopez', 'Ramos'];
        $localNumber = fake()->numerify('9#########');

        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement($phFirstNames).' '.fake()->randomElement($phLastNames),
            'phone' => '+63'.$localNumber,
            'region_code' => Region::factory(),
            'province_code' => Province::factory(),
            'city_code' => City::factory(),
            'barangay_code' => Barangay::factory(),
            'street' => 'Unit '.fake()->numberBetween(1, 20).fake()->lexify('?').', '.fake()->numberBetween(1, 200).' '.fake()->lastName().' St.',
            'postal_code' => (string) fake()->numberBetween(1000, 9999),
            'landmark' => fake()->optional()->sentence(3),
            'label' => fake()->randomElement(AddressLabel::cases()),
            'is_default' => false,
        ];
    }
}
