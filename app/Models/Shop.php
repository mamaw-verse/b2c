<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ShopFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $user_id
 * @property string $name
 * @property string $slug
 * @property string $location
 * @property float $rating
 * @property int $followers_count
 * @property int|null $chat_response_rate
 * @property string|null $verification
 * @property bool $halal_only
 * @property string|null $description
 * @property string|null $logo_url
 * @property string|null $banner_url
 * @property bool $vacation_mode
 * @property bool $auto_reply
 * @property array<string, bool>|null $shipping_channels
 * @property bool $suspended
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'slug', 'location', 'rating', 'followers_count', 'chat_response_rate', 'verification', 'halal_only', 'description', 'logo_url', 'banner_url', 'vacation_mode', 'auto_reply', 'shipping_channels', 'suspended'])]
final class Shop extends Model
{
    /** @use HasFactory<ShopFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** @return MorphMany<HalalCertification, $this> */
    public function halalCertifications(): MorphMany
    {
        return $this->morphMany(HalalCertification::class, 'certifiable');
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<Conversation, $this> */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /** @return MorphMany<Report, $this> */
    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'halal_only' => 'boolean',
            'vacation_mode' => 'boolean',
            'auto_reply' => 'boolean',
            'shipping_channels' => 'array',
        ];
    }
}
