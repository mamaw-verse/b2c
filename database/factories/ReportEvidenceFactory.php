<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Report;
use App\Models\ReportEvidence;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReportEvidence>
 */
final class ReportEvidenceFactory extends Factory
{
    protected $model = ReportEvidence::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'report_id' => Report::factory(),
            'file_path' => '/images/compliance/admin-flagged-meat-1.jpg',
            'display_order' => 0,
        ];
    }
}
