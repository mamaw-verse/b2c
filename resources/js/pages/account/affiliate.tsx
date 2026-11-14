import { Form, Head } from '@inertiajs/react';
import {
    Check,
    Copy,
    DollarSign,
    Gift,
    Percent,
    Share2,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Media } from '@/components/media';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatPeso } from '@/lib/format';

type AffiliateProfileData = {
    id: string;
    code: string;
    status: string;
    total_earned: number;
    pending: number;
    available: number;
};

type PromotableProduct = {
    id: string;
    name: string;
    slug: string;
    shop_name: string;
    category_name: string;
    price: number;
    commission_bps: number;
    commission_percent: number;
    referral_url: string;
    image_url?: string | null;
    icon: string;
};

type PageProps = {
    profile: AffiliateProfileData | null;
    products: {
        data: PromotableProduct[];
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    } | null;
};

export default function AffiliatePage({ profile, products }: PageProps) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

    function copyToClipboard(
        text: string,
        isCode: boolean,
        productId?: string,
    ) {
        void navigator.clipboard.writeText(text);
        if (isCode) {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } else if (productId) {
            setCopiedProductId(productId);
            setTimeout(() => setCopiedProductId(null), 2000);
        }
    }

    return (
        <>
            <Head title="Affiliate Program" />

            <div className="grid gap-6">
                <div>
                    <h1 className="text-h1">Affiliate Program</h1>
                    <p className="mt-1 text-body text-muted-foreground">
                        Recommend halal-certified and verified products to your
                        audience and earn commission on every eligible sale.
                    </p>
                </div>

                {profile === null ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-5 text-primary" />
                                <CardTitle>
                                    Become a Marketplace Affiliate
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Join our partner network and start earning
                                commissions immediately.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="card p-4">
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-tile bg-primary-soft text-primary">
                                        <Percent className="size-4" />
                                    </div>
                                    <h3 className="text-label font-bold">
                                        Earn up to 30%
                                    </h3>
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        Generous commissions set directly by
                                        product sellers on eligible items.
                                    </p>
                                </div>
                                <div className="card p-4">
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-tile bg-primary-soft text-primary">
                                        <Share2 className="size-4" />
                                    </div>
                                    <h3 className="text-label font-bold">
                                        30-Day Cookie
                                    </h3>
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        Earn commissions on any eligible
                                        purchase made within 30 days of clicking
                                        your link.
                                    </p>
                                </div>
                                <div className="card p-4">
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-tile bg-primary-soft text-primary">
                                        <DollarSign className="size-4" />
                                    </div>
                                    <h3 className="text-label font-bold">
                                        Transparent Ledger
                                    </h3>
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        Snapshotted rates guaranteed at purchase
                                        time with automated payouts.
                                    </p>
                                </div>
                            </div>

                            <Form method="post" action="/account/affiliate">
                                <Button type="submit" size="lg">
                                    Activate Affiliate Account
                                </Button>
                            </Form>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Profile & Earnings Summary */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="card p-4">
                                <span className="text-body-sm text-muted-foreground">
                                    Referral code
                                </span>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                    <span className="font-mono text-h3 font-bold">
                                        {profile.code}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(profile.code, true)
                                        }
                                        aria-label="Copy referral code"
                                    >
                                        {copiedCode ? (
                                            <Check className="size-4 text-success" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                        <span className="ml-1">
                                            {copiedCode ? 'Copied' : 'Copy'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            <div className="card p-4">
                                <span className="text-body-sm text-muted-foreground">
                                    Total earned
                                </span>
                                <p className="tabular mt-1 text-h3 font-bold">
                                    {formatPeso(profile.total_earned)}
                                </p>
                            </div>

                            <div className="card p-4">
                                <span className="text-body-sm text-muted-foreground">
                                    Pending hold
                                </span>
                                <p className="tabular mt-1 text-h3 font-bold text-muted-foreground">
                                    {formatPeso(profile.pending)}
                                </p>
                            </div>

                            <div className="card p-4">
                                <span className="text-body-sm text-muted-foreground">
                                    Available balance
                                </span>
                                <p className="tabular mt-1 text-h3 font-bold text-success">
                                    {formatPeso(profile.available)}
                                </p>
                            </div>
                        </div>

                        {/* Eligible Products */}
                        <section className="grid gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-h2">
                                        Promote Products
                                    </h2>
                                    <p className="text-body-sm text-muted-foreground">
                                        Copy referral links for products with
                                        active affiliate commissions.
                                    </p>
                                </div>
                            </div>

                            {products && products.data.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {products.data.map((p) => {
                                        const estCut = Math.round(
                                            (p.price * p.commission_percent) /
                                                100,
                                        );
                                        const isCopied =
                                            copiedProductId === p.id;

                                        return (
                                            <div
                                                key={p.id}
                                                className="card flex flex-col justify-between p-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-12 shrink-0 overflow-hidden rounded-tile">
                                                            <Media
                                                                src={
                                                                    p.image_url
                                                                }
                                                                icon={p.icon}
                                                                label={p.name}
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="truncate text-label font-bold">
                                                                {p.name}
                                                            </h3>
                                                            <p className="text-body-sm text-muted-foreground">
                                                                {p.shop_name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="tabular text-label font-semibold">
                                                            {formatPeso(
                                                                p.price,
                                                            )}
                                                        </span>
                                                        <Badge variant="info">
                                                            {
                                                                p.commission_percent
                                                            }
                                                            % (
                                                            {formatPeso(estCut)}
                                                            /sale)
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="mt-4 border-t border-border pt-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                p.referral_url,
                                                                false,
                                                                p.id,
                                                            )
                                                        }
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="mr-1.5 size-4 text-success" />
                                                                <span>
                                                                    Link copied!
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="mr-1.5 size-4" />
                                                                <span>
                                                                    Copy
                                                                    referral
                                                                    link
                                                                </span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="card grid place-items-center p-8 text-center text-muted-foreground">
                                    <Gift className="mb-2 size-8" />
                                    <p>
                                        No products are currently enrolled in
                                        the affiliate program. Check back soon!
                                    </p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </>
    );
}
