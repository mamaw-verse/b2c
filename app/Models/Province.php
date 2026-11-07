<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProvinceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $code
 * @property string $name
 * @property string $region_code
 */
#[Fillable(['code', 'name', 'region_code'])]
final class Province extends Model
{
    /** @use HasFactory<ProvinceFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    /** @return BelongsTo<Region, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_code', 'code');
    }

    /** @return HasMany<City, $this> */
    public function cities(): HasMany
    {
        return $this->hasMany(City::class, 'province_code', 'code');
    }
}
