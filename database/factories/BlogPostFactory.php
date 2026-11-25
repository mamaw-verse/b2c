<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BlogPostStatus;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogImage;
use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogPost>
 */
final class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    public function definition(): array
    {
        $title = Str::title(mb_rtrim(fake()->unique()->sentence(5), '.'));
        $markdown = collect(range(1, 4))
            ->map(fn () => '## '.implode(' ', (array) fake()->words(3))."\n\n".fake()->paragraph(8))
            ->implode("\n\n");
        $words = str_word_count(strip_tags($markdown));

        return [
            'blog_category_id' => BlogCategory::factory(),
            'blog_author_id' => BlogAuthor::factory(),
            'created_by_id' => null,
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => fake()->text(160),
            'body_markdown' => $markdown,
            'body_html' => '<p>'.e(strip_tags($markdown)).'</p>',
            'toc' => null,
            'word_count' => $words,
            'reading_minutes' => max(1, (int) ceil($words / 200)),
            'cover_image_id' => null,
            'thumbnail_image_id' => null,
            'faqs' => null,
            'status' => BlogPostStatus::Draft,
            'published_at' => null,
            'is_featured' => false,
            'view_count' => 0,
            'seo_title' => null,
            'seo_description' => null,
        ];
    }

    public function draft(): self
    {
        return $this->state(['status' => BlogPostStatus::Draft, 'published_at' => null]);
    }

    /** Live now (published in the past) with a cover image. */
    public function published(): self
    {
        return $this->state(fn () => [
            'status' => BlogPostStatus::Published,
            'published_at' => now()->subHour(),
            'cover_image_id' => BlogImage::factory(),
        ]);
    }

    /** Published status but a future `published_at`: not live yet. */
    public function scheduled(): self
    {
        return $this->state(fn () => [
            'status' => BlogPostStatus::Published,
            'published_at' => now()->addDay(),
            'cover_image_id' => BlogImage::factory(),
        ]);
    }

    public function archived(): self
    {
        return $this->state(fn () => [
            'status' => BlogPostStatus::Archived,
            'published_at' => now()->subWeek(),
        ]);
    }

    public function featured(): self
    {
        return $this->state(['is_featured' => true]);
    }
}
