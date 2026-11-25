<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BlogTag;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogTag>
 */
final class BlogTagFactory extends Factory
{
    protected $model = BlogTag::class;

    public function definition(): array
    {
        $name = Str::title((string) fake()->unique()->word());

        return ['name' => $name, 'slug' => Str::slug($name)];
    }
}
