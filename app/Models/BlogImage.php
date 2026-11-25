<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BlogImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

/**
 * @property string $id
 * @property string|null $uploaded_by_id
 * @property string $purpose cover|thumbnail|body|avatar
 * @property string $disk
 * @property string $original_path
 * @property array<string, array{path: string, width: int, height: int}> $variants
 * @property int $width
 * @property int $height
 * @property int $bytes
 * @property string $mime
 * @property string|null $alt
 * @property string|null $caption
 */
#[Fillable([
    'uploaded_by_id', 'purpose', 'disk', 'original_path', 'variants',
    'width', 'height', 'bytes', 'mime', 'alt', 'caption',
])]
final class BlogImage extends Model
{
    /** @use HasFactory<BlogImageFactory> */
    use HasFactory, HasUlids;

    public const PURPOSES = ['cover', 'thumbnail', 'body', 'avatar'];

    /** @return BelongsTo<User, $this> */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    /** @return BelongsToMany<BlogPost, $this> */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(BlogPost::class, 'blog_post_images');
    }

    /**
     * Images no post (including soft-deleted ones), cover, thumbnail or author avatar points at.
     *
     * @param  Builder<BlogImage>  $query
     * @return Builder<BlogImage>
     */
    public function scopeUnreferenced(Builder $query): Builder
    {
        $references = [
            ['blog_post_images', 'blog_image_id'],
            ['blog_authors', 'avatar_image_id'],
            ['blog_posts', 'cover_image_id'],
            ['blog_posts', 'thumbnail_image_id'],
        ];

        foreach ($references as [$table, $column]) {
            $query->whereNotExists(function ($subquery) use ($table, $column): void {
                $subquery->select(DB::raw(1))
                    ->from($table)
                    ->whereColumn("{$table}.{$column}", 'blog_images.id');
            });
        }

        return $query;
    }

    public function isReferenced(): bool
    {
        return ! self::query()->whereKey($this->getKey())->unreferenced()->exists();
    }

    /** Every file this row owns (original plus variants). @return list<string> */
    public function storedPaths(): array
    {
        $paths = [$this->original_path];
        foreach ($this->variants as $variant) {
            $paths[] = $variant['path'];
        }

        return array_values(array_unique($paths));
    }

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'width' => 'integer',
            'height' => 'integer',
            'bytes' => 'integer',
        ];
    }
}
