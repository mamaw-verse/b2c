<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BlogAuthor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogAuthor>
 */
final class BlogAuthorFactory extends Factory
{
    protected $model = BlogAuthor::class;

    /** A consented, active guest author by default so published-post factories are valid. */
    public function definition(): array
    {
        $name = fake()->unique()->name();

        return [
            'user_id' => null,
            'display_name' => $name,
            'slug' => Str::slug($name),
            'job_title' => fake()->jobTitle(),
            'bio' => fake()->sentence(12),
            'avatar_image_id' => null,
            'links' => null,
            'is_house' => false,
            'is_active' => true,
            'consent_confirmed_at' => now(),
            'consent_confirmed_by_id' => null,
            'consent_version' => (string) config('blog.consent_version', 'v1'),
        ];
    }

    public function house(): self
    {
        return $this->state([
            'display_name' => (string) config('blog.house_author_name'),
            'slug' => Str::slug((string) config('blog.house_author_name')),
            'job_title' => null,
            'bio' => null,
            'is_house' => true,
            'consent_confirmed_at' => null,
            'consent_version' => null,
        ]);
    }

    public function withoutConsent(): self
    {
        return $this->state(['consent_confirmed_at' => null, 'consent_confirmed_by_id' => null, 'consent_version' => null]);
    }

    public function inactive(): self
    {
        return $this->state(['is_active' => false]);
    }
}
