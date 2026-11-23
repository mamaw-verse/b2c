<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Single source for machine-readable trust and policy facts (docs/planning/14 T4.3).
 *
 * Page meta descriptions, JSON-LD (Organization / Offer return policy) and /llms.txt all read
 * from here, which in turn reads config/marketplace.php, so the numbers and claims in each
 * surface cannot drift apart. Claims that need a business decision (halal verification) stay
 * behind a config flag and are omitted, never softened or invented, when the flag is off.
 */
final readonly class TrustFacts
{
    /**
     * Days after order completion in which a return can be requested. 0 = returns not permitted.
     */
    public static function returnWindowDays(): int
    {
        return max(0, (int) config('marketplace.return_window_days', 7));
    }

    /**
     * Whether the marketplace may claim it verifies halal certificates. Off until the business enables it.
     */
    public static function halalVerificationClaimed(): bool
    {
        return (bool) config('marketplace.claims.halal_verification', false);
    }

    /**
     * Human wording of the return window, e.g. "within 7 days after your order is completed".
     */
    public static function returnWindowPhrase(): string
    {
        $days = self::returnWindowDays();

        if ($days === 0) {
            return 'Returns are not accepted';
        }

        return 'Return requests are accepted within '.$days.' '.($days === 1 ? 'day' : 'days').' after an order is completed';
    }

    /**
     * Short "return within N days" wording for meta descriptions, or null when returns are not permitted.
     */
    public static function returnWindowShort(): ?string
    {
        $days = self::returnWindowDays();

        return $days === 0 ? null : 'Request returns within '.$days.' '.($days === 1 ? 'day' : 'days');
    }

    /**
     * Ordered, public-safe facts about how the marketplace works. Each entry only exists when
     * the underlying config backs it.
     *
     * @return list<array{key: string, label: string, text: string}>
     */
    public static function statements(): array
    {
        $facts = [];

        // Escrow is advertised sitewide (home, categories, terms), so it is stated here without a flag.
        $facts[] = [
            'key' => 'escrow',
            'label' => 'Checkout',
            'text' => 'Escrow-protected checkout: the buyer\'s payment stays protected until the transaction conditions are met.',
        ];

        $facts[] = [
            'key' => 'returns',
            'label' => 'Returns',
            'text' => self::returnWindowPhrase().'.'.(self::returnWindowDays() > 0 ? ' Disputed requests are reviewed by a moderator.' : ''),
        ];

        $autoConfirmDays = (int) config('marketplace.auto_confirm_days', 0);
        if ($autoConfirmDays > 0) {
            $facts[] = [
                'key' => 'auto_confirm',
                'label' => 'Order completion',
                'text' => 'Shipped orders the buyer does not confirm are completed automatically after '.$autoConfirmDays.' '.($autoConfirmDays === 1 ? 'day' : 'days').'.',
            ];
        }

        $facts[] = [
            'key' => 'coverage',
            'label' => 'Delivery coverage',
            'text' => 'Sellers ship to buyers across the Philippines. Shipping fees are calculated at checkout, and some products ship free.',
        ];

        $couriers = array_map('strval', config()->array('marketplace.couriers', []));
        if ($couriers !== []) {
            $facts[] = [
                'key' => 'couriers',
                'label' => 'Couriers',
                'text' => implode(', ', $couriers).'.',
            ];
        }

        $payments = array_map('strval', config()->array('marketplace.payments', []));
        if ($payments !== []) {
            $facts[] = [
                'key' => 'payments',
                'label' => 'Payment methods',
                'text' => implode(', ', $payments).'.',
            ];
        }

        $facts[] = [
            'key' => 'seller_approval',
            'label' => 'Sellers',
            'text' => 'Shops are reviewed and approved by the marketplace before their products are listed publicly.',
        ];

        if (self::halalVerificationClaimed()) {
            $facts[] = [
                'key' => 'halal_verification',
                'label' => 'Halal verification',
                'text' => 'Halal certificates submitted by sellers are checked by the marketplace before halal claims are shown.',
            ];
        }

        return $facts;
    }
}
