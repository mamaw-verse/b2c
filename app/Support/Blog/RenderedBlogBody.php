<?php

declare(strict_types=1);

namespace App\Support\Blog;

/**
 * Result of `RenderBlogBody`. `errors` block publishing; `warnings` do not.
 */
final readonly class RenderedBlogBody
{
    /**
     * @param  list<array{id: string, text: string, level: int}>  $toc
     * @param  list<string>  $imageIds  blog_images ids referenced via `blog-image:`, in order, unique
     * @param  list<string>  $productSlugs  slugs from standalone `[[product:slug]]` lines, in order, unique
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    public function __construct(
        public string $html,
        public array $toc,
        public int $wordCount,
        public int $readingMinutes,
        public array $imageIds,
        public array $productSlugs,
        public array $errors,
        public array $warnings,
    ) {
        //
    }
}
