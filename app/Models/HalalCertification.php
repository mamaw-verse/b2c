<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\HalalCertificationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $certifying_body
 * @property string $number
 * @property string|null $scope
 * @property Carbon $valid_until
 * @property Carbon|null $checked_at
 * @property string|null $document_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['certifying_body', 'number', 'scope', 'valid_until', 'checked_at', 'document_path'])]
final class HalalCertification extends Model
{
    /** @use HasFactory<HalalCertificationFactory> */
    use HasFactory, HasUlids;

    /** @return MorphTo<Model, $this> */
    public function certifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function status(): string
    {
        if ($this->valid_until->isPast()) {
            return 'expired';
        }

        return $this->valid_until->lte(now()->addDays(30)) ? 'expiring' : 'certified';
    }

    protected function casts(): array
    {
        return [
            'valid_until' => 'date',
            'checked_at' => 'datetime',
        ];
    }
}
