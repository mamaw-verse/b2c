export type BenefitAudience = {
    id: string;
    title: string;
    eyebrow: string;
    headline: string;
    summary: string;
    body: string;
    bullets: string[];
    cta: {
        label: string;
        target: 'shopping' | 'selling' | 'certification' | 'b2b';
        external?: boolean;
    };
};

export type HomeBenefitsContent = {
    heading: string;
    intro: string;
    audiences: BenefitAudience[];
};

export const homeBenefitsContent: HomeBenefitsContent = {
    heading: 'Why Choose Our Marketplace?',
    intro: "A trusted marketplace built around halal values. Whether you're buying, selling, seeking halal certification, or growing your business, we're here to make every connection easier, safer, and more meaningful.",
    audiences: [
        {
            id: 'buyers',
            title: 'For Buyers',
            eyebrow: 'Shop with confidence',
            headline: 'Discover halal. Shop with peace of mind.',
            summary:
                'Escrow protection, secure checkout, and verified halal goods.',
            body: 'Enjoy a seamless shopping experience with access to halal-certified products and a marketplace designed to protect your purchases.',
            bullets: [
                'Secure Payments – Shop confidently with secure payment transactions.',
                'Buyer Protection – Enjoy added peace of mind with our escrow system, keeping your payment protected until the transaction conditions are met.',
                'Halal-Certified Goods – Discover products that meet halal certification standards.',
            ],
            cta: {
                label: 'Start Shopping',
                target: 'shopping',
            },
        },
        {
            id: 'sellers',
            title: 'For Sellers',
            eyebrow: 'Grow your business',
            headline: 'Bring your halal products to more customers.',
            summary:
                'Reach conscious shoppers, expand your store, and build trusted sales.',
            body: 'Reach a growing community of conscious consumers looking for trusted halal products. Showcase your offerings, build credibility, and grow your business through our marketplace.',
            bullets: [
                'Expand your customer reach.',
                'Showcase your halal products.',
                'Build trust with halal-conscious buyers.',
                'Grow your business through digital commerce.',
            ],
            cta: {
                label: 'Start Selling',
                target: 'selling',
            },
        },
        {
            id: 'certification',
            title: 'For Certification Applicants',
            eyebrow: 'Get certified',
            headline: 'Take the next step toward halal certification.',
            summary:
                'Access official guidance, certification pathways, and market credibility.',
            body: 'Looking to have your products or business halal-certified? Connect with the right certification pathway and take the first step toward building consumer trust and expanding your market opportunities.',
            bullets: [
                'Explore halal certification opportunities.',
                'Access application information.',
                'Strengthen your product’s credibility.',
                'Build confidence among halal-conscious consumers.',
            ],
            cta: {
                label: 'Apply for Halal Certification',
                target: 'certification',
            },
        },
        {
            id: 'businesses',
            title: 'For Businesses',
            eyebrow: 'B2B opportunities',
            headline:
                'More than a marketplace. Your gateway to halal business opportunities.',
            summary:
                'Wholesale bulk purchasing and cross-border B2B halal trade.',
            body: 'Looking to source halal products or explore business partnerships? Discover our B2B platform, designed to connect businesses and unlock opportunities across the halal industry.',
            bullets: [
                'Discover wholesale and bulk purchasing opportunities.',
                'Explore business-to-business connections.',
                'Expand your reach in the halal ecosystem by listing your business and products.',
            ],
            cta: {
                label: 'Explore Our B2B Platform ↗',
                target: 'b2b',
                external: true,
            },
        },
    ],
};
