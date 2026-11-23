<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\TrustFacts;

/**
 * Builds one schema.org `MerchantReturnPolicy`. The window comes from TrustFacts
 * (config('marketplace.return_window_days')) so page copy, Offer, Organization and
 * /llms.txt cannot disagree.
 */
final readonly class BuildReturnPolicyNode
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $days = TrustFacts::returnWindowDays();

        if ($days === 0) {
            return [
                '@type' => 'MerchantReturnPolicy',
                'applicableCountry' => 'PH',
                'returnPolicyCategory' => 'https://schema.org/MerchantReturnNotPermitted',
            ];
        }

        return [
            '@type' => 'MerchantReturnPolicy',
            'applicableCountry' => 'PH',
            'returnPolicyCategory' => 'https://schema.org/MerchantReturnFiniteReturnWindow',
            'merchantReturnDays' => $days,
        ];
    }
}
