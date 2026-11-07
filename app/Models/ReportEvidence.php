<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ReportEvidenceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $report_id
 * @property string $file_path
 * @property int $display_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['report_id', 'file_path', 'display_order'])]
final class ReportEvidence extends Model
{
    /** @use HasFactory<ReportEvidenceFactory> */
    use HasFactory, HasUlids;

    protected $table = 'report_evidences';

    /** @return BelongsTo<Report, $this> */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}
