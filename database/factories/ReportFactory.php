<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ReportStatus;
use App\Models\Product;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
final class ReportFactory extends Factory
{
    protected $model = Report::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'reportable_type' => Product::class,
            'reportable_id' => Product::factory(),
            'reason' => 'Misleading description or price',
            'details' => fake()->paragraph(),
            'status' => ReportStatus::Pending,
        ];
    }
}
