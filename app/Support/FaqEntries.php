<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Visible FAQ entries per public page (docs/planning/14 T4.4).
 *
 * The same list is rendered on the page and emitted as `FAQPage` JSON-LD, so the markup can never
 * describe Q&A the visitor cannot see. Answers are short, self-contained and built from
 * TrustFacts, so numbers and claims match the rest of the site. Pages with no entries get no FAQ.
 */
final readonly class FaqEntries
{
    public const array PAGES = ['why-choose-us', 'returns', 'halal-verification'];

    /**
     * @return list<array{question: string, answer: string}>
     */
    public static function for(string $page): array
    {
        return match ($page) {
            'why-choose-us' => self::whyChooseUs(),
            'returns' => self::returns(),
            'halal-verification' => self::halalVerification(),
            default => [],
        };
    }

    /**
     * @return list<array{question: string, answer: string}>
     */
    private static function whyChooseUs(): array
    {
        $name = (string) config('seo.site_name', 'HalalBenta');

        $entries = [
            [
                'question' => "Is my payment protected when I buy on {$name}?",
                'answer' => "Yes. {$name} uses escrow-protected checkout, so your payment stays protected until the transaction conditions are met. "
                    .'If something is wrong with an order, you can open it under My purchases and request a return or refund, and a moderator reviews any disputed request.',
            ],
            [
                'question' => 'Can I return an item?',
                'answer' => self::returnAnswer(),
            ],
            [
                'question' => "Where does {$name} deliver?",
                'answer' => "Sellers on {$name} ship to buyers across the Philippines. Shipping fees are calculated at checkout before you pay, and some products ship free. "
                    .'The product page shows whether free shipping applies.',
            ],
            [
                'question' => 'Who can sell on the marketplace?',
                'answer' => 'Independent businesses can apply to open a shop. Each shop is reviewed and approved by the marketplace before its products are listed publicly, '
                    .'and sellers must follow the published seller terms.',
            ],
        ];

        if (TrustFacts::halalVerificationClaimed()) {
            $entries[] = self::halalVerification()[0];
        }

        return $entries;
    }

    /**
     * @return list<array{question: string, answer: string}>
     */
    private static function returns(): array
    {
        $entries = [
            [
                'question' => 'How long do I have to request a return?',
                'answer' => self::returnAnswer(),
            ],
        ];

        if (TrustFacts::returnWindowDays() === 0) {
            return $entries;
        }

        return [
            ...$entries,
            [
                'question' => 'How do I request a return or refund?',
                'answer' => 'Open the order under My purchases and choose Return/Refund. The seller reviews your request, and a moderator steps in if it is disputed. '
                    .'The order timeline records each step, including the amount approved.',
            ],
            [
                'question' => 'Can I get a partial refund?',
                'answer' => 'Yes. Choose the item quantities you want reviewed, and the seller may approve a partial refund for those quantities or a full refund for all remaining items. '
                    .'Approved amounts reflect your share of any order voucher discount.',
            ],
            [
                'question' => 'What if the seller declines my request?',
                'answer' => 'A declined request includes the seller\'s reason. If you disagree, contact support with your order number and the details of your request, and the team will review the case.',
            ],
        ];
    }

    /**
     * Only published when the business has enabled the halal-verification claim, mirroring the footer.
     *
     * @return list<array{question: string, answer: string}>
     */
    private static function halalVerification(): array
    {
        if (! TrustFacts::halalVerificationClaimed()) {
            return [];
        }

        $name = (string) config('seo.site_name', 'HalalBenta');

        return [
            [
                'question' => "How does {$name} verify halal products?",
                'answer' => "Sellers can submit halal certificates, and {$name} checks them before halal claims are shown. "
                    .'Where a seller provides a certificate, the product page shows its status and details.',
            ],
        ];
    }

    private static function returnAnswer(): string
    {
        if (TrustFacts::returnWindowDays() === 0) {
            return 'Returns are not accepted on this marketplace.';
        }

        return TrustFacts::returnWindowPhrase().'. Open the order under My purchases to start a request.';
    }
}
