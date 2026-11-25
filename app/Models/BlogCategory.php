<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BlogCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property int $sort_order
 * @property bool $is_system
 * @property string|null $shop_category_id
 */
#[Fillable(['name', 'slug', 'description', 'sort_order', 'is_system', 'shop_category_id'])]
final class BlogCategory extends Model
{
    /** @use HasFactory<BlogCategoryFactory> */
    use HasFactory, HasUlids;

    /** @return HasMany<BlogPost, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function shopCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'shop_category_id');
    }

    protected static function booted(): void
    {
        $invalidate = static fn () => resolve(\App\Actions\Blog\InvalidateBlogCache::class)->handle();

        self::saved($invalidate);
        self::deleted($invalidate);
    }

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_system' => 'boolean',
        ];
    }
}
