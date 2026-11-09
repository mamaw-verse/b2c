<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $parent_id
 * @property string $name
 * @property string $slug
 * @property string $icon
 * @property int $sort_order
 * @property int|null $commission_bps
 * @property bool $requires_certification
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['parent_id', 'name', 'slug', 'icon', 'sort_order', 'commission_bps', 'requires_certification'])]
final class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Category, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<Category, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** @return list<string> */
    public function descendantIds(): array
    {
        $ids = [];

        foreach ($this->children()->get() as $child) {
            $ids[] = $child->id;
            array_push($ids, ...$child->descendantIds());
        }

        return $ids;
    }

    protected function casts(): array
    {
        return [
            'requires_certification' => 'boolean',
            'commission_bps' => 'integer',
        ];
    }
}
