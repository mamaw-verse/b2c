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
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/**
 * @property string $id
 * @property string $shop_id
 * @property string $category_id
 * @property string $name
 * @property string|null $brand
 * @property string|null $gtin
 * @property string $slug
 * @property string|null $description
 * @property int $price
 * @property int|null $was_price
 * @property float $rating
 * @property int $sold_count
 * @property string $location
 * @property string|null $country_of_origin
 * @property bool $free_shipping
 * @property bool $frozen
 * @property string|null $storage_condition
 * @property HalalStatus $halal_status
 * @property int $stock
 * @property string|null $option1_name
 * @property string|null $option2_name
 * @property bool $published
 * @property bool $hidden
 * @property string|null $ingredients
 * @property string|null $allergens
 * @property bool $no_pork_alcohol_declared
 * @property float|null $weight
 * @property float|null $length
 * @property float|null $width
 * @property float|null $height
 * @property string|null $video_media_id
 * @property string|null $video_path
 * @property int|null $video_duration
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property bool $affiliate_enabled
 * @property int|null $affiliate_commission_bps
 * @property int $share_count
 */
#[Fillable(['shop_id', 'category_id', 'name', 'brand', 'gtin', 'slug', 'description', 'price', 'was_price', 'rating', 'sold_count', 'location', 'country_of_origin', 'free_shipping', 'frozen', 'storage_condition', 'halal_status', 'stock', 'option1_name', 'option2_name', 'published', 'hidden', 'ingredients', 'allergens', 'no_pork_alcohol_declared', 'weight', 'length', 'width', 'height', 'video_media_id', 'video_path', 'video_duration', 'affiliate_enabled', 'affiliate_commission_bps'])]
final class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, HasUlids;

    public function resolveRouteBinding($value, $field = null): ?Model
    {
        $field = $field ?? $this->getRouteKeyName();
        $model = parent::resolveRouteBinding($value, $field);
        if ($model !== null) {
            return $model;
        }

        if ($field === 'slug' && is_string($value)) {
            $history = ProductSlugHistory::where('slug', $value)->with('product')->first();
            if ($history !== null && $history->product !== null) {
                abort(redirect()->to(route('products.show', $history->product), 301));
            }
        }

        return null;
    }

    /** @return HasMany<ProductSlugHistory, $this> */
    public function slugHistories(): HasMany
    {
        return $this->hasMany(ProductSlugHistory::class);
    }

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

    /** @return HasMany<ProductShareStat, $this> */
    public function shareStats(): HasMany
    {
        return $this->hasMany(ProductShareStat::class);
    }

    /**
     * Images to show in a gallery: real photos only. A placeholder row
     * (empty url) is returned only when it is all the product has, so the
     * gallery still renders its icon.
     *
     * @return \Illuminate\Support\Collection<int, ProductImage>
     */
    public function galleryImages(): \Illuminate\Support\Collection
    {
        $real = $this->images->filter(fn (ProductImage $image) => $image->url !== '')->values();

        return $real->isNotEmpty() ? $real : $this->images->take(1)->values();
    }

    public function thumbnailUrl(): ?string
    {
        return $this->images->firstWhere('url', '!=', '')?->url;
    }

    /** @return BelongsTo<Media, $this> */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'video_media_id');
    }

    public function videoUrl(): ?string
    {
        if ($this->video_media_id !== null && Route::has('media.view')) {
            return route('media.view', ['media' => $this->video_media_id]);
        }

        if ($this->video_path === null) {
            return null;
        }

        return Storage::disk('public')->url($this->video_path);
    }

    /** @return array{url: string|null, duration: int|null}|null */
    public function videoDetail(): ?array
    {
        if ($this->video_media_id !== null) {
            $media = $this->video;
            if ($media !== null && $media->scan_status !== 'clean') {
                return null;
            }

            return [
                'url' => $this->videoUrl(),
                'duration' => $this->video_duration,
            ];
        }

        if ($this->video_path !== null) {
            return [
                'url' => $this->videoUrl(),
                'duration' => $this->video_duration,
            ];
        }

        return null;
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
            'image_url' => $this->images->firstWhere('url', '!=', '')?->url,
            'icon' => $this->images->firstWhere('url', '!=', '')?->icon ?? $this->images->first()?->icon ?? 'package',
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    /** @return array<string, mixed> */
    public function toDetail(): array
    {
        return $this->toCard() + [
            'brand' => $this->brand,
            'gtin' => $this->gtin,
            'ingredients' => $this->ingredients,
            'allergens' => $this->allergens,
            'storage_condition' => $this->storage_condition,
            'country_of_origin' => $this->country_of_origin,
            'description' => $this->description,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'review_count' => $this->reviews()->count(),
            'ships_from' => $this->location ?? $this->shop->location,
            'images' => $this->galleryImages()->map(fn (ProductImage $image) => [
                'url' => $image->url,
                'icon' => $image->icon,
            ])->all(),
            'video' => $this->videoDetail(),
            'option1_name' => $this->option1_name,
            'option2_name' => $this->option2_name,
            'variations' => $this->variations->map(fn (ProductVariation $v) => [
                'id' => $v->id,
                'option1_value' => $v->option1_value,
                'option2_value' => $v->option2_value,
                'price' => $v->price,
                'was_price' => $v->was_price,
                'stock' => $v->stock,
                'weight' => $v->weight,
                'length' => $v->length,
                'width' => $v->width,
                'height' => $v->height,
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

    protected static function booted(): void
    {
        self::saved(static function (self $product): void {
            resolve(\App\Actions\Seo\InvalidateSitemapCache::class)->handle();

            if ($product->published && ! $product->hidden) {
                dispatch(new \App\Jobs\PreWarmSocialImageJob(
                    'product',
                    $product->slug,
                    (string) ($product->updated_at?->timestamp ?? time())
                ));
            }
        });

        self::deleted(static function (): void {
            resolve(\App\Actions\Seo\InvalidateSitemapCache::class)->handle();
        });

        self::updating(static function (self $product): void {
            if ($product->isDirty('slug')) {
                $oldSlug = (string) $product->getOriginal('slug');
                if ($oldSlug !== '' && $oldSlug !== $product->slug) {
                    ProductSlugHistory::firstOrCreate([
                        'product_id' => $product->id,
                        'slug' => $oldSlug,
                    ]);
                }
            }
        });
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
            'hidden' => 'boolean',
            'no_pork_alcohol_declared' => 'boolean',
            'weight' => 'float',
            'length' => 'float',
            'width' => 'float',
            'height' => 'float',
            'halal_status' => HalalStatus::class,
            'video_duration' => 'integer',
            'affiliate_enabled' => 'boolean',
            'share_count' => 'integer',
        ];
    }

    /** @param Builder<Product> $query */
    #[Scope]
    protected function affiliateEligible(Builder $query): void
    {
        $query->visible()
            ->where('hidden', false)
            ->where('affiliate_enabled', true)
            ->whereHas('shop', fn (Builder $q) => $q->where('status', 'approved')->where('suspended', false));
    }
}
