<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BlogCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogCategory>
 */
final class BlogCategoryFactory extends Factory
{
    protected $model = BlogCategory::class;

    public function definition(): array
    {
        $name = Str::title(implode(' ', (array) fake()->unique()->words(2)));

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => null,
            'sort_order' => fake()->numberBetween(0, 20),
            'is_system' => false,
            'shop_category_id' => null,
        ];
    }

    public function system(): self
    {
        return $this->state(['is_system' => true]);
    }
}
