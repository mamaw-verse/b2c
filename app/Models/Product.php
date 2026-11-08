<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HalalStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $shop_id
 * @property string $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property int $price
 * @property int|null $was_price
 * @property float $rating
 * @property int $sold_count
 * @property string $location
 * @property bool $free_shipping
 * @property bool $frozen
 * @property HalalStatus $halal_status
 * @property int $stock
 * @property string|null $option1_name
 * @property string|null $option2_name
 * @property bool $published
 * @property string|null $ingredients
 * @property bool $no_pork_alcohol_declared
 * @property float|null $weight
 * @property float|null $length
 * @property float|null $width
 * @property float|null $height
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'category_id', 'name', 'slug', 'description', 'price', 'was_price', 'rating', 'sold_count', 'location', 'free_shipping', 'frozen', 'halal_status', 'stock', 'option1_name', 'option2_name', 'published', 'hidden', 'ingredients', 'no_pork_alcohol_declared', 'weight', 'length', 'width', 'height'])]
final class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<ProductVariation, $this> */
    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class)->orderBy('sort_order');
    }

    /** @return HasMany<ProductImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->latest();
    }

    /** @return MorphMany<Report, $this> */
    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    /** @return MorphOne<HalalCertification, $this> */
    public function halalCertification(): MorphOne
    {
        return $this->morphOne(HalalCertification::class, 'certifiable')->latestOfMany('valid_until');
    }

    /** @return MorphMany<HalalCertification, $this> */
    public function halalCertifications(): MorphMany
    {
        return $this->morphMany(HalalCertification::class, 'certifiable');
    }

    /** @return array<string, mixed> */
    public function toCard(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'price' => $this->price,
            'was_price' => $this->was_price,
            'rating' => $this->rating,
            'sold_count' => $this->sold_count,
            'location' => $this->location,
            'free_shipping' => $this->free_shipping,
            'frozen' => $this->frozen,
            'temperature' => $this->frozen ? 'frozen' : null,
            'requires_certification' => $this->category->requires_certification,
            'in_stock' => $this->stock > 0,
            'halal_status' => $this->halal_status->value,
            'certifier' => $this->halalCertification?->certifying_body,
            'image_url' => $this->images->first()?->url,
            'icon' => $this->images->isEmpty() ? 'package' : $this->images->first()->icon,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    /** @return array<string, mixed> */
    public function toDetail(): array
    {
        return $this->toCard() + [
            'description' => $this->description,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'review_count' => $this->reviews()->count(),
            'ships_from' => $this->location ?? $this->shop->location,
            'images' => $this->images->map(fn (ProductImage $image) => [
                'url' => $image->url,
                'icon' => $image->icon,
            ])->all(),
            'option1_name' => $this->option1_name,
            'option2_name' => $this->option2_name,
            'variations' => $this->variations->map(fn (ProductVariation $v) => [
                'id' => $v->id,
                'option1_value' => $v->option1_value,
                'option2_value' => $v->option2_value,
                'price' => $v->price,
                'stock' => $v->stock,
            ])->all(),
            'certification' => $this->halalCertification ? [
                'certifying_body' => $this->halalCertification->certifying_body,
                'number' => $this->halalCertification->number,
                'scope' => $this->halalCertification->scope,
                'valid_until' => $this->halalCertification->valid_until->toDateString(),
                'checked_at' => $this->halalCertification->checked_at?->toDateString(),
                'document_path' => $this->halalCertification->document_path,
                'status' => $this->halalCertification->status(),
            ] : null,
            'category' => $this->category->only('name', 'slug'),
            'shop' => [
                'id' => $this->shop->id,
                'name' => $this->shop->name,
                'slug' => $this->shop->slug,
                'location' => $this->shop->location,
                'rating' => $this->shop->rating,
                'followers_count' => $this->shop->followers_count,
                'chat_response_rate' => $this->shop->chat_response_rate,
                'verification' => $this->shop->verification,
                'halal_only' => $this->shop->halal_only,
                'logo_url' => $this->shop->logo_url,
                'banner_url' => $this->shop->banner_url,
                'products_count' => $this->shop->products()->visible()->count(),
            ],
        ];
    }

    /** @param Builder<Product> $query */
    #[Scope]
    protected function visible(Builder $query): void
    {
        $query->where('published', true)->whereIn(
            'halal_status',
            collect(HalalStatus::cases())->filter->visibleToBuyers()->map->value,
        );
    }

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'free_shipping' => 'boolean',
            'frozen' => 'boolean',
            'published' => 'boolean',
            'no_pork_alcohol_declared' => 'boolean',
            'weight' => 'float',
            'length' => 'float',
            'width' => 'float',
            'height' => 'float',
            'halal_status' => HalalStatus::class,
        ];
    }
}
