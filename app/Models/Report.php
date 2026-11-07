<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ReportStatus;
use Database\Factories\ReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $reporter_id
 * @property string $reportable_type
 * @property string $reportable_id
 * @property string $reason
 * @property string|null $details
 * @property ReportStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['reporter_id', 'reportable_type', 'reportable_id', 'reason', 'details', 'status'])]
final class Report extends Model
{
    /** @use HasFactory<ReportFactory> */
    use HasFactory, HasUlids;

    /** @return MorphTo<Model, $this> */
    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<User, $this> */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /** @return HasMany<ReportEvidence, $this> */
    public function evidences(): HasMany
    {
        return $this->hasMany(ReportEvidence::class)->orderBy('display_order', 'asc');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
        ];
    }
}
