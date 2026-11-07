<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Review;
use App\Models\ReviewPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewPhoto>
 */
final class ReviewPhotoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'review_id' => Review::factory(),
            'path' => 'reviews/sample.jpg',
            'position' => 0,
        ];
    }
}
