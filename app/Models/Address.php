<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AddressLabel;
use Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $user_id
 * @property string $name
 * @property string $phone
 * @property string $region_code
 * @property string $province_code
 * @property string $city_code
 * @property string $barangay_code
 * @property string $street
 * @property-read string $formatted_address
 * @property string $postal_code
 * @property string|null $landmark
 * @property AddressLabel $label
 * @property bool $is_default
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'phone', 'region_code', 'province_code', 'city_code', 'barangay_code', 'street', 'postal_code', 'landmark', 'label', 'is_default'])]
final class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $appends = ['formatted_address'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Region, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_code', 'code');
    }

    /** @return BelongsTo<Province, $this> */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_code', 'code');
    }

    /** @return BelongsTo<Barangay, $this> */
    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_code', 'code');
    }

    public function formatAddress(): string
    {
        $parts = array_filter([
            $this->street,
            $this->barangay?->name,
            $this->city?->name,
            mb_trim("{$this->province?->name} {$this->postal_code}"),
        ], fn (?string $part) => $part !== null && $part !== '');

        return implode(', ', $parts);
    }

    public function getFormattedAddressAttribute(): string
    {
        return $this->formatAddress();
    }

    protected function casts(): array
    {
        return [
            'label' => AddressLabel::class,
            'is_default' => 'boolean',
        ];
    }
}
