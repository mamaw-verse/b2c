<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
final class MediaFactory extends Factory
{
    protected $model = Media::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'original_filename' => 'product.mp4',
            'extension' => 'mp4',
            'storage_path' => 'media/'.fake()->uuid().'.mp4',
            'mime_type' => 'video/mp4',
            'description' => 'Product video',
            'scan_status' => 'clean',
            'uploaded_by_id' => User::factory(),
        ];
    }

    public function pending(): static
    {
        return $this->state(['scan_status' => 'pending']);
    }

    public function infected(): static
    {
        return $this->state(['scan_status' => 'infected']);
    }

    public function webm(): static
    {
        return $this->state([
            'original_filename' => 'product.webm',
            'extension' => 'webm',
            'storage_path' => 'media/'.fake()->uuid().'.webm',
            'mime_type' => 'video/webm',
        ]);
    }
}
