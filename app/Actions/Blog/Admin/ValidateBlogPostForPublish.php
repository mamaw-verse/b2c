<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Blog\RenderBlogBody;
use App\Models\BlogPost;
use App\Models\Product;
use App\Support\Blog\BlogPublishCheck;
use App\Support\Blog\BlogSlug;

/**
 * The server-side publish gate (docs/planning/15-blog.md §5.3). It re-renders the Markdown so a
 * deleted image or a changed product shows up now, not only at the last save.
 */
final readonly class ValidateBlogPostForPublish
{
    private const MIN_WORDS = 150;

    public function __construct(private RenderBlogBody $renderer) {}

    public function handle(BlogPost $post): BlogPublishCheck
    {
        $post->loadMissing(['author', 'category', 'coverImage']);
        $body = $this->renderer->handle($post->body_markdown);

        $errors = [];
        $warnings = [];

        if (mb_trim($post->title) === '') {
            $errors[] = 'Add a title.';
        }

        if (preg_match(BlogSlug::FORMAT, $post->slug) !== 1 || BlogSlug::isReserved($post->slug)) {
            $errors[] = 'The slug is invalid or reserved. Use lowercase letters, numbers and hyphens.';
        } elseif (BlogSlug::taken($post->slug, 'blog_posts', 'slug', $post->id)) {
            $errors[] = 'Another post already uses this slug.';
        }

        if ($post->category === null) {
            $errors[] = 'Choose a category.';
        }

        $excerptLength = mb_strlen(mb_trim($post->excerpt));
        if ($excerptLength < 50 || $excerptLength > 300) {
            $errors[] = "The excerpt must be 50 to 300 characters (currently {$excerptLength}).";
        }

        $author = $post->author;
        if ($author === null) {
            $errors[] = 'Choose an author.';
        } elseif (! $author->is_active) {
            $errors[] = "The author \"{$author->display_name}\" is deactivated. Choose another author.";
        } elseif (! $author->canBeCredited()) {
            $errors[] = "The author \"{$author->display_name}\" has not confirmed they agree to be credited.";
        }

        $cover = $post->coverImage;
        if ($cover === null) {
            $errors[] = 'Add a cover image.';
        } else {
            if (mb_trim((string) $cover->alt) === '') {
                $errors[] = 'The cover image needs alt text.';
            }
            [$minWidth, $minHeight] = array_map('intval', explode('x', (string) config('blog.images.cover_min', '1200x630')) + [1 => '0']);
            if ($cover->width < $minWidth || $cover->height < $minHeight) {
                $warnings[] = "The cover is smaller than {$minWidth}×{$minHeight}, so social previews may look soft.";
            }
        }

        if ($body->wordCount < self::MIN_WORDS) {
            $errors[] = 'The body needs at least '.self::MIN_WORDS." words (currently {$body->wordCount}).";
        }

        foreach ($body->errors as $error) {
            $errors[] = $error;
        }

        if (str_contains($body->html, 'alt=""')) {
            $errors[] = 'Every image in the body needs alt text.';
        }

        if ($body->productSlugs !== []) {
            $found = Product::query()->whereIn('slug', $body->productSlugs)->pluck('slug')->all();
            foreach (array_diff($body->productSlugs, $found) as $missing) {
                $errors[] = "Unknown product: {$missing}";
            }

            $visible = Product::visible()->whereIn('slug', $body->productSlugs)->pluck('slug')->all();
            foreach (array_diff($found, $visible) as $hidden) {
                $warnings[] = "The product {$hidden} is not available right now, so its card will be skipped.";
            }
        }

        if (! collect($body->toc)->contains(fn (array $entry): bool => $entry['level'] === 2)) {
            $warnings[] = 'Add at least one section heading (# Heading becomes an h2) so readers can scan the article.';
        }

        $haystack = mb_strtolower($post->title.' '.$post->excerpt.' '.$post->body_markdown);
        foreach ((array) config('blog.flagged_phrases', []) as $phrase) {
            if (is_string($phrase) && $phrase !== '' && str_contains($haystack, mb_strtolower($phrase))) {
                $warnings[] = "Check the claim \"{$phrase}\": halal and health statements must be documented (editorial rules).";
            }
        }

        if ($post->thumbnail_image_id === null) {
            $warnings[] = 'No thumbnail: cards will use the cover image.';
        }

        if ($post->seo_title !== null && $post->seo_title !== ''
            && BlogPost::query()->where('seo_title', $post->seo_title)->whereKeyNot($post->id)->exists()) {
            $warnings[] = 'Another post uses the same SEO title.';
        }

        $bodyImageLimit = (int) config('blog.images.per_post_max', 30);
        if (count($body->imageIds) > $bodyImageLimit) {
            $warnings[] = "This post has more than {$bodyImageLimit} images.";
        }

        foreach ($body->warnings as $warning) {
            $warnings[] = $warning;
        }

        return new BlogPublishCheck(array_values(array_unique($errors)), array_values(array_unique($warnings)));
    }
}
