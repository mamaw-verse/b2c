/**
 * Draft Seller Terms for Barakah Market.
 *
 * This is the single source of truth for the terms text rendered at
 * /seller/terms. It is a DRAFT pending product-owner and legal review —
 * do not treat it as legal advice or final copy.
 *
 * {placeholder} tokens in the text are resolved at render time from
 * config('marketplace.seller_terms.*'). Tokens without a config value
 * render as "[to be confirmed]".
 */

export type TermsSection = {
    id: string;
    title: string;
    paragraphs?: string[];
    items?: string[];
};

export const termsContent = {
    version: '0.1',
    updated: '2026-11-09',
    sections: [
        {
            id: 'who-can-sell',
            title: '1. Who can sell',
            paragraphs: [
                'To sell on {entity_name} you must be at least 18 years old, hold a verified buyer account, and provide accurate information about yourself and your shop.',
                'Depending on your business type you may be required to hold business registration, such as a DTI business name registration or a mayor’s permit, and a valid government-issued ID for identity verification.',
                'Each account may operate one shop. If you need a second shop, contact us at {contact_email} before applying.',
            ],
        },
        {
            id: 'account-and-shop-info',
            title: '2. Your account and shop information',
            items: [
                'Keep your shop name, description, address and documents accurate and up to date.',
                'Notify us promptly if your business permit or certificates change or lapse.',
                'You are responsible for activity on your account — do not share your login or sell access to your shop.',
                'We may suspend selling while your information is incomplete or under review.',
            ],
        },
        {
            id: 'halal-commitments',
            title: '3. Halal commitments',
            paragraphs: [
                'Barakah Market is a halal-focused marketplace. As a seller you commit to the following:',
            ],
            items: [
                'List only halal-certified or halal-permissible products.',
                'Provide accurate certificate details (certifying body, number, expiry date) and keep them current.',
                'Tell us when a certificate lapses or is revoked, and renew it before expiry where possible.',
                'Never list prohibited items such as pork, alcohol, or products containing non-halal derivatives presented as halal.',
                'Label products truthfully — do not describe an item as halal unless you can back the claim.',
                'If you hold the Halal-only shop badge, every listing must meet the badge standard; we may remove the badge if a listing breaks it.',
            ],
        },
        {
            id: 'listings-and-content',
            title: '4. Listings and content',
            items: [
                'Titles, photos, descriptions, prices and stock counts must be accurate and current.',
                'No misleading claims, fake discounts, or bait-and-switch listings.',
                'Do not list prohibited or restricted items (illegal goods, recalled products, counterfeit items).',
                'Product photos must show the actual item; stock photos that mislead buyers are not allowed.',
            ],
        },
        {
            id: 'orders-and-fulfilment',
            title: '5. Orders and fulfilment',
            items: [
                'Ship orders within {ship_within_days} days of confirmation.',
                'Pack items securely; follow cold-chain handling for frozen and chilled goods.',
                'Provide tracking information where the courier supports it.',
                'Couriers collect orders and returns from your registered pickup address — keep it current.',
            ],
        },
        {
            id: 'returns-refunds-disputes',
            title: '6. Returns, refunds and disputes',
            paragraphs: [
                'Buyers may request a return or refund within {return_window_days} days of delivery for eligible reasons (wrong item, damage in transit, spoiled goods, misdescribed items).',
                'Where the seller is at fault, the seller covers return shipping and the refund. We mediate disputes using order records, photos and chat history, and our decision is final within the platform.',
            ],
        },
        {
            id: 'fees-and-payouts',
            title: '7. Fees and payouts',
            paragraphs: [
                'We charge a commission of {commission_rate} on completed orders. Payouts are released {payout_schedule}.',
                'You are responsible for your own taxes and any registrations required by Philippine law. We may place a hold on or reverse payouts for fraud, disputes, or breaches of these terms.',
            ],
        },
        {
            id: 'seller-conduct',
            title: '8. Seller conduct',
            items: [
                'No fake reviews or review manipulation of any kind.',
                'Do not take payments off-platform or direct buyers to transact elsewhere.',
                'Communicate with buyers respectfully — abusive, harassing or discriminatory chat is not tolerated.',
                'No counterfeit goods or infringement of others’ brands.',
            ],
        },
        {
            id: 'moderation-and-enforcement',
            title: '9. Moderation and enforcement',
            paragraphs: [
                'We moderate listings, certificates and shop applications. Content may be reported by buyers or flagged by automated checks (for example, an expired certificate).',
                'Depending on severity we may remove a listing, send a warning, suspend selling, or reject an application. Rejected applicants may fix the issue and re-apply.',
            ],
        },
        {
            id: 'data-privacy',
            title: '10. Data privacy',
            paragraphs: [
                'We process your personal data under the Data Privacy Act of 2012 (Republic Act No. 10173). We collect what we need to verify your identity and business, fulfil orders, and pay you — such as your name, address, government ID, permits, and payout details.',
                'Verification documents are visible to our review team only; your public shop page shows your shop name, logo, and general location. We retain application data for as long as your shop is active plus the period required by law. Contact {contact_email} for access, correction or deletion requests, and see our privacy notice for details.',
            ],
        },
        {
            id: 'intellectual-property',
            title: '11. Intellectual property',
            paragraphs: [
                'You own the content you upload — product photos, descriptions, logos and your shop name.',
                'By listing on {entity_name} you grant us a non-exclusive, royalty-free licence to display, reproduce and promote that content on and about the platform for as long as the listing is live.',
            ],
        },
        {
            id: 'liability',
            title: '12. Liability and indemnity',
            paragraphs: [
                'PLACEHOLDER — this section is reserved for wording under legal review. It will cover limits of {entity_name}’s liability for marketplace transactions and the seller’s obligation to indemnify the platform for claims arising from their products and conduct.',
            ],
        },
        {
            id: 'suspension-and-termination',
            title: '13. Suspension and termination',
            paragraphs: [
                'You may stop selling and close your shop at any time; pending orders must still be fulfilled or refunded.',
                '{entity_name} may suspend or terminate a shop for breaches of these terms, fraud, or legal requirements. Suspension pauses listings; termination ends the account’s selling ability. Legitimately earned payouts are still released, subject to holds for open disputes.',
            ],
        },
        {
            id: 'changes',
            title: '14. Changes to these terms',
            paragraphs: [
                'We may update these terms. We will notify sellers by email and in the seller area before a new version takes effect, and the version number will change.',
                'Continuing to sell after the notice period means you accept the updated terms. If you do not agree, stop selling before the new version takes effect.',
            ],
        },
        {
            id: 'governing-law',
            title: '15. Governing law and contact',
            paragraphs: [
                'These terms are governed by the laws of the Republic of the Philippines. Disputes are brought before the courts of {venue}.',
                'Questions about these terms: contact {contact_email}. To start selling, return to the application form.',
            ],
        },
    ] satisfies TermsSection[],
};

export type SellerTermsConfig = {
    version: string;
    updated: string;
    draft: boolean;
    [key: string]: string | boolean | null;
};

const TBC = '[to be confirmed]';

/**
 * Replace {placeholder} tokens with config values. Missing values render
 * "[to be confirmed]" — highlighted in dev builds so gaps are obvious.
 */
export function resolveTermsText(
    text: string,
    values: SellerTermsConfig,
): string {
    return text.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = values[key];

        return typeof value === 'string' && value !== '' ? value : TBC;
    });
}

/** List the placeholder tokens that have no configured value. */
export function unresolvedPlaceholders(
    sections: TermsSection[],
    values: SellerTermsConfig,
): string[] {
    const tokens = new Set<string>();
    for (const section of sections) {
        for (const line of [
            ...(section.paragraphs ?? []),
            ...(section.items ?? []),
        ]) {
            for (const match of line.matchAll(/\{(\w+)\}/g)) {
                const key = match[1];
                const value = values[key];
                if (typeof value !== 'string' || value === '') {
                    tokens.add(key);
                }
            }
        }
    }

    return [...tokens];
}
