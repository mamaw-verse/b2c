<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

/**
 * Builds one schema.org `Offer` from values already shown on the product page.
 *
 * Prices are stored in centavos. Nothing is invented: no `priceValidUntil` (there is no
 * price-expiry field), and shipping is emitted only when the rate is actually known (free shipping).
 */
final readonly class BuildOfferNode
{
    /**
     * @param  int  $price  Selling price in centavos.
     * @param  int|null  $wasPrice  Strike-through price in centavos, when higher than `$price`.
     * @param  array<string, mixed>|null  $seller  Organization reference or stub.
     * @return array<string, mixed>
     */
    public function handle(
        int $price,
        ?int $wasPrice,
        bool $inStock,
        string $url,
        ?array $seller,
        bool $freeShipping,
        ?string $name = null,
    ): array {
        $offer = [
            '@type' => 'Offer',
            'name' => $name,
            'url' => $url,
            'price' => $this->decimal($price),
            'priceCurrency' => 'PHP',
            'availability' => $inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            'itemCondition' => 'https://schema.org/NewCondition',
            'seller' => $seller,
            'hasMerchantReturnPolicy' => $this->returnPolicy(),
            'shippingDetails' => $freeShipping ? $this->freeShipping() : null,
        ];

        if ($wasPrice !== null && $wasPrice > $price) {
            $offer['priceSpecification'] = [
                '@type' => 'UnitPriceSpecification',
                'price' => $this->decimal($wasPrice),
                'priceCurrency' => 'PHP',
                'priceType' => 'https://schema.org/StrikethroughPrice',
            ];
        }

        return $offer;
    }

    private function decimal(int $centavos): string
    {
        return number_format($centavos / 100, 2, '.', '');
    }

    /**
     * Window comes from config('marketplace.return_window_days') so page copy and schema cannot disagree.
     *
     * @return array<string, mixed>
     */
    private function returnPolicy(): array
    {
        $days = (int) config('marketplace.return_window_days', 7);

        if ($days <= 0) {
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

    /**
     * @return array<string, mixed>
     */
    private function freeShipping(): array
    {
        $shipWithin = config('marketplace.seller_terms.ship_within_days');
        $handlingDays = is_numeric($shipWithin) && (int) $shipWithin > 0 ? (int) $shipWithin : null;

        return [
            '@type' => 'OfferShippingDetails',
            'shippingRate' => [
                '@type' => 'MonetaryAmount',
                'value' => '0.00',
                'currency' => 'PHP',
            ],
            'shippingDestination' => [
                '@type' => 'DefinedRegion',
                'addressCountry' => 'PH',
            ],
            'deliveryTime' => $handlingDays !== null ? [
                '@type' => 'ShippingDeliveryTime',
                'handlingTime' => [
                    '@type' => 'QuantitativeValue',
                    'minValue' => 0,
                    'maxValue' => $handlingDays,
                    'unitCode' => 'DAY',
                ],
            ] : null,
        ];
    }
}
