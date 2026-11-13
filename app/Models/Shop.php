<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ShopStatus;
use Database\Factories\ShopFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
 * @property ShopStatus $status
 * @property string|null $rejection_reason
 * @property Carbon|null $submitted_at
 * @property Carbon|null $reviewed_at
 * @property string|null $reviewed_by
 * @property string|null $address_line
 * @property string|null $city
 * @property string|null $state
 * @property string|null $postal_code
 * @property string|null $region_code
 * @property string|null $province_code
 * @property string|null $city_code
 * @property string|null $barangay_code
 * @property string|null $business_permit_url
 * @property string|null $payout_method
 * @property string|null $payout_account_name
 * @property string|null $payout_account_number
 * @property bool $agreed_to_terms
 * @property string|null $terms_version
 * @property Carbon|null $terms_accepted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'slug', 'location', 'rating', 'followers_count', 'chat_response_rate', 'verification', 'halal_only', 'description', 'logo_url', 'banner_url', 'vacation_mode', 'auto_reply', 'shipping_channels', 'suspended', 'status', 'rejection_reason', 'submitted_at', 'reviewed_at', 'reviewed_by', 'address_line', 'city', 'state', 'postal_code', 'region_code', 'province_code', 'city_code', 'barangay_code', 'business_permit_url', 'payout_method', 'payout_account_name', 'payout_account_number', 'agreed_to_terms', 'terms_version', 'terms_accepted_at'])]
final class Shop extends Model
{
    /** @use HasFactory<ShopFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isApproved(): bool
    {
        return $this->status === ShopStatus::Approved;
    }

    public function isPending(): bool
    {
        return $this->status === ShopStatus::Pending;
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

    /** @return HasMany<LedgerEntry, $this> */
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    /** @return HasMany<Payout, $this> */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
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

    /** @return BelongsToMany<User, $this> */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shop_followers')->withTimestamps();
    }

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'halal_only' => 'boolean',
            'vacation_mode' => 'boolean',
            'auto_reply' => 'boolean',
            'shipping_channels' => 'array',
            'payout_account_number' => 'encrypted',
            'status' => ShopStatus::class,
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'agreed_to_terms' => 'boolean',
            'terms_accepted_at' => 'datetime',
        ];
    }
}
