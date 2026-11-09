import { Head, Link } from '@inertiajs/react';
import { Banknote, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';

type OrderConfirmedPageProps = {
    order: {
        id: string;
        reference: string;
        status_label: string;
        status_badge_variant:
            | 'neutral'
            | 'info'
            | 'warning'
            | 'success'
            | 'danger';
        total: number;
        payment_method: string;
        cod_fee: number;
        items: {
            id: string;
            product_name: string;
            variation_label?: string | null;
            qty: number;
        }[];
        shop?: { name: string; slug: string } | null;
    };
};

export default function OrderConfirmed({ order }: OrderConfirmedPageProps) {
    const isCod = order.payment_method === 'cod';

    return (
        <>
            <Head title="Order confirmed" />

            <div className="mx-auto grid max-w-container place-items-center px-[var(--gutter)] py-10 md:py-16">
                <div className="card grid w-full max-w-lg gap-5 p-6 text-center md:p-8">
                    <CheckCircle2
                        className="mx-auto size-14 text-success-text"
                        aria-hidden="true"
                    />

                    <div>
                        <h1 className="text-h2">Order placed</h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            Thanks! Your order has been received by the shop.
                        </p>
                    </div>

                    <div className="grid gap-2 rounded-panel border border-border bg-surface-subtle p-4 text-left">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-body-sm text-muted-foreground">
                                Order reference
                            </span>
                            <span className="tabular text-label font-bold">
                                {order.reference}
                            </span>
                        </div>
                        {order.shop && (
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-body-sm text-muted-foreground">
                                    Shop
                                </span>
                                <span className="text-label">
                                    {order.shop.name}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-body-sm text-muted-foreground">
                                Status
                            </span>
                            <Badge variant={order.status_badge_variant}>
                                {order.status_label}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                            <span className="text-body-sm text-muted-foreground">
                                Total
                            </span>
                            <span className="tabular text-price-lg font-bold text-foreground">
                                {formatPeso(order.total)}
                            </span>
                        </div>
                    </div>

                    {isCod && (
                        <p className="flex items-start gap-2 rounded-panel border border-border bg-surface-subtle p-3 text-left text-body-sm">
                            <Banknote
                                className="mt-0.5 size-5 shrink-0 text-primary-text"
                                aria-hidden="true"
                            />
                            <span>
                                Please prepare{' '}
                                <span className="font-bold">
                                    {formatPeso(order.total)}
                                </span>{' '}
                                in cash — the rider collects payment on
                                delivery.
                            </span>
                        </p>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                        <Button asChild size="lg">
                            <Link href={`/account/orders/${order.id}`}>
                                View order
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/">Continue shopping</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

OrderConfirmed.layout = {
    breadcrumbs: [{ title: 'My Purchases', href: '/account/orders' }],
};
