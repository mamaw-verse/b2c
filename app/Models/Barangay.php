<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BarangayFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $code
 * @property string $name
 * @property string $city_code
 */
#[Fillable(['code', 'name', 'city_code'])]
final class Barangay extends Model
{
    /** @use HasFactory<BarangayFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_code', 'code');
    }
}
