<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BlogPostStatus;
use Database\Factories\BlogPostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $blog_category_id
 * @property string $blog_author_id
 * @property string|null $created_by_id
 * @property string $title
 * @property string $slug
 * @property string $excerpt
 * @property string $body_markdown
 * @property string $body_html
 * @property array<int, array{id: string, text: string, level: int}>|null $toc
 * @property int $word_count
 * @property int $reading_minutes
 * @property string|null $cover_image_id
 * @property string|null $thumbnail_image_id
 * @property array<int, array{question: string, answer: string}>|null $faqs
 * @property BlogPostStatus $status
 * @property Carbon|null $published_at
 * @property bool $is_featured
 * @property int $view_count
 * @property string|null $seo_title
 * @property string|null $seo_description
 */
#[Fillable([
    'blog_category_id', 'blog_author_id', 'created_by_id', 'title', 'slug', 'excerpt',
    'body_markdown', 'body_html', 'toc', 'word_count', 'reading_minutes',
    'cover_image_id', 'thumbnail_image_id', 'faqs', 'status', 'published_at',
    'is_featured', 'view_count', 'seo_title', 'seo_description',
])]
final class BlogPost extends Model
{
    /** @use HasFactory<BlogPostFactory> */
    use HasFactory, HasUlids, SoftDeletes;

    /** @return BelongsTo<BlogCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    /**
     * Public byline. Never the internal creator unless they are also the author.
     *
     * @return BelongsTo<BlogAuthor, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(BlogAuthor::class, 'blog_author_id');
    }

    /**
     * Internal creator (immutable, not exposed publicly).
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /** @return BelongsTo<BlogImage, $this> */
    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(BlogImage::class, 'cover_image_id');
    }

    /** @return BelongsTo<BlogImage, $this> */
    public function thumbnailImage(): BelongsTo
    {
        return $this->belongsTo(BlogImage::class, 'thumbnail_image_id');
    }

    /** @return BelongsToMany<BlogTag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tag');
    }

    /** @return BelongsToMany<Product, $this> */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'blog_post_products')->withPivot('sort_order');
    }

    /** @return BelongsToMany<BlogImage, $this> */
    public function images(): BelongsToMany
    {
        return $this->belongsToMany(BlogImage::class, 'blog_post_images');
    }

    /** @return HasMany<BlogPostSlugHistory, $this> */
    public function slugHistories(): HasMany
    {
        return $this->hasMany(BlogPostSlugHistory::class);
    }

    /**
     * Live = published and its publish time has arrived (plan §4.5).
     *
     * @param  Builder<BlogPost>  $query
     */
    public function scopeLive(Builder $query): void
    {
        $query->where('status', BlogPostStatus::Published->value)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /** @param Builder<BlogPost> $query */
    public function scopeFeatured(Builder $query): void
    {
        $query->where('is_featured', true);
    }

    /** @param Builder<BlogPost> $query */
    public function scopeInCategory(Builder $query, BlogCategory|string $category): void
    {
        $query->where('blog_category_id', $category instanceof BlogCategory ? $category->id : $category);
    }

    /** @param Builder<BlogPost> $query */
    public function scopeByAuthor(Builder $query, BlogAuthor|string $author): void
    {
        $query->where('blog_author_id', $author instanceof BlogAuthor ? $author->id : $author);
    }

    /** @param Builder<BlogPost> $query */
    public function scopeSearch(Builder $query, string $term): void
    {
        $term = mb_trim($term);

        if ($term === '') {
            return;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';

        // Case-insensitive on every driver (ILIKE on PostgreSQL).
        $query->where(fn (Builder $q) => $q
            ->whereLike('title', $like, caseSensitive: false)
            ->orWhereLike('excerpt', $like, caseSensitive: false));
    }

    public function isLive(): bool
    {
        return $this->status === BlogPostStatus::Published
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }

    public function isScheduled(): bool
    {
        return $this->status === BlogPostStatus::Published
            && $this->published_at !== null
            && $this->published_at->gt(now());
    }

    protected function casts(): array
    {
        return [
            'status' => BlogPostStatus::class,
            'toc' => 'array',
            'faqs' => 'array',
            'published_at' => 'datetime',
            'is_featured' => 'boolean',
            'word_count' => 'integer',
            'reading_minutes' => 'integer',
            'view_count' => 'integer',
        ];
    }
}
