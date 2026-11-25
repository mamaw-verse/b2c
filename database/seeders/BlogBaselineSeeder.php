<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Idempotent production baseline for the blog (docs/planning/15-blog.md B0.5):
 * the launch categories and the house author. Safe to run repeatedly:
 *
 *   php artisan db:seed --class=BlogBaselineSeeder --force
 *
 * Existing rows are matched by slug and never overwritten, so copy edited in
 * the admin (names, descriptions, order) survives a re-run. Category
 * descriptions are intentionally left empty until real copy exists.
 */
final class BlogBaselineSeeder extends Seeder
{
    /** @var array<int, array{slug: string, name: string, system?: bool}> */
    private const CATEGORIES = [
        ['slug' => 'shopping-guides', 'name' => 'Shopping guides'],
        ['slug' => 'halal-food-and-pantry', 'name' => 'Halal food and pantry'],
        ['slug' => 'recipes', 'name' => 'Recipes'],
        ['slug' => 'ramadan-and-eid', 'name' => 'Ramadan and Eid'],
        ['slug' => 'lifestyle', 'name' => 'Lifestyle'],
        ['slug' => 'seller-stories', 'name' => 'Seller stories', 'system' => true],
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $index => $category) {
            BlogCategory::query()->firstOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'sort_order' => ($index + 1) * 10,
                    'is_system' => $category['system'] ?? false,
                ],
            );
        }

        $this->seedHouseAuthor();
    }

    private function seedHouseAuthor(): void
    {
        // Exactly one house author: reuse it if present, whatever its current name.
        if (BlogAuthor::query()->where('is_house', true)->exists()) {
            return;
        }

        $name = config()->string('blog.house_author_name');

        BlogAuthor::query()->create([
            'display_name' => $name,
            'slug' => $this->uniqueAuthorSlug(Str::slug($name)),
            'is_house' => true,
            'is_active' => true,
        ]);
    }

    private function uniqueAuthorSlug(string $base): string
    {
        $slug = $base;
        $n = 2;

        while (BlogAuthor::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
