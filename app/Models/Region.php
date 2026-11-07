<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\RegionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $code
 * @property string $name
 */
#[Fillable(['code', 'name'])]
final class Region extends Model
{
    /** @use HasFactory<RegionFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    /** @return HasMany<Province, $this> */
    public function provinces(): HasMany
    {
        return $this->hasMany(Province::class, 'region_code', 'code');
    }
}
