<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Models\Category;
use App\Support\Settings;

final readonly class ResolveCommissionRate
{
    public function __construct(private Settings $settings) {}

    public function handle(Category $category): int
    {
        for ($node = $category; $node !== null; $node = $node->parent) {
            if ($node->commission_bps !== null) {
                return $node->commission_bps;
            }
        }

        return $this->settings->marketplaceInt('commission.default_bps');
    }
}
