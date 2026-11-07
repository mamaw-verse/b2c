<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $code
 * @property string $name
 * @property string $province_code
 * @property bool $is_municipality
 */
#[Fillable(['code', 'name', 'province_code', 'is_municipality'])]
final class City extends Model
{
    /** @use HasFactory<CityFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    /** @return BelongsTo<Province, $this> */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }

    /** @return HasMany<Barangay, $this> */
    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class, 'city_code', 'code');
    }
}
