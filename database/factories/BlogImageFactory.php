<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BlogImage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogImage>
 */
final class BlogImageFactory extends Factory
{
    protected $model = BlogImage::class;

    /** Metadata-only row; no file is written (the pipeline in Phase 1 produces real files). */
    public function definition(): array
    {
        $key = 'blog-images/'.now()->format('Y/m').'/'.Str::lower(Str::random(24));

        return [
            'uploaded_by_id' => null,
            'purpose' => 'cover',
            'disk' => (string) config('blog.images.disk', 'public'),
            'original_path' => $key.'.jpg',
            'variants' => [
                'thumb' => ['path' => $key.'-480.webp', 'width' => 480, 'height' => 270],
                'medium' => ['path' => $key.'-960.webp', 'width' => 960, 'height' => 540],
                'large' => ['path' => $key.'-1600.webp', 'width' => 1600, 'height' => 900],
                'og' => ['path' => $key.'-og.jpg', 'width' => 1200, 'height' => 630],
            ],
            'width' => 2400,
            'height' => 1350,
            'bytes' => 250_000,
            'mime' => 'image/jpeg',
            'alt' => fake()->sentence(6),
            'caption' => null,
        ];
    }

    public function purpose(string $purpose): self
    {
        return $this->state(['purpose' => $purpose]);
    }
}
