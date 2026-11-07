<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
final class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = implode(' ', (array) fake()->unique()->words(2));

        return [
            'parent_id' => null,
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'icon' => 'package',
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }
}
