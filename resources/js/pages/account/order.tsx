import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    MapPin,
    MessageCircle,
    MoonStar,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { Timeline, type TimelineEvent } from '@/components/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TextArea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import { create as createReview } from '@/routes/reviews';

type OrderDetailPageProps = {
    order: {
        id: string;
        reference: string;
        status: string;
        status_label: string;
        status_badge_variant:
            | 'neutral'
            | 'info'
            | 'warning'
            | 'success'
            | 'danger';
        subtotal: number;
        shipping_fee: number;
        shipping_discount: number;
        voucher_discount: number;
        platform_voucher_discount: number;
        total: number;
        cod_fee: number;
        payment_method: string;
        notes?: string | null;
        created_at: string;
        shop?: {
            id: string;
            name: string;
            slug: string;
        };
        address?: {
            name: string;
            phone: string;
            street: string;
            formatted_address: string;
            label: string;
            is_default: boolean;
        };
        shippingOption?: {
            name: string;
            fee: number;
        };
        events?: {
            id: string;
            title: string;
            detail?: string | null;
            location?: string | null;
            created_at: string;
        }[];
        items: {
            id: string;
            product_name: string;
            variation_label?: string | null;
            unit_price: number;
            qty: number;
            subtotal: number;
            product?: {
                id: string;
                slug: string;
                images?: { url: string }[];
            };
            review?: {
                id: string;
                rating: number;
                body?: string | null;
            } | null;
        }[];
    };
};

export default function OrderDetail({ order }: OrderDetailPageProps) {
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const isCancellable = ['pending', 'to_pay', 'to_ship'].includes(
        order.status,
    );
    const isReturnable = order.status === 'completed';
    const isToReceive = order.status === 'to_receive';

    const handleMarkReceived = () => {
        if (
            confirm(
                'Confirm that you have received this order in good condition?',
            )
        ) {
            router.put(`/account/orders/${order.id}/received`);
        }
    };

    const handleCancelOrder = () => {
        setProcessing(true);
        router.post(
            `/account/orders/${order.id}/cancel`,
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setCancelModalOpen(false);
                },
            },
        );
    };

    const handleReturnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnReason.trim()) return;

        setProcessing(true);
        router.post(
            `/account/orders/${order.id}/return`,
            {
                reason: returnReason,
            },
            {
                onFinish: () => {
                    setProcessing(false);
                    setReturnModalOpen(false);
                },
            },
        );
    };

    // Prepare timeline events
    const timelineEvents: TimelineEvent[] =
        order.events && order.events.length > 0
            ? order.events.map((evt, idx) => ({
                  title: evt.title,
                  detail:
                      evt.detail ||
                      (evt.location ? `Location: ${evt.location}` : null),
                  time: formatDateTime(evt.created_at),
                  state: idx === 0 ? 'current' : 'done',
              }))
            : [
                  {
                      title: 'Order placed',
                      detail: `Payment method: ${order.payment_method.toUpperCase()}`,
                      time: formatDateTime(order.created_at),
                      state: order.status === 'completed' ? 'done' : 'current',
                  },
              ];

    const latestEvent = order.events?.[0];

    return (
        <>
            <Head title={`Order ${order.reference}`} />

            <div className="grid gap-6">
                {/* Back button & Header */}
                <div>
                    <Link
                        href="/account/orders"
                        className="mb-2 inline-flex items-center gap-1 text-body-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ChevronLeft className="size-4" />
                        <span>Back to My Purchases</span>
                    </Link>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h1 className="tabular text-h2">
                                Order {order.reference}
                            </h1>
                            <Badge variant={order.status_badge_variant}>
                                {order.status_label}
                            </Badge>
                        </div>
                    </div>

                    <p className="mt-1 text-body-sm text-muted-foreground">
                        Placed {formatDate(order.created_at)}
                        {order.shop && (
                            <>
                                {' · '}
                                <Link
                                    href={`/shops/${order.shop.slug}`}
                                    className="font-bold text-foreground hover:underline"
                                >
                                    {order.shop.name}
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {/* Current status Banner */}
                {order.status === 'cancelled' ? (
                    <div className="rounded-panel border border-danger bg-danger-soft p-3 text-body-sm text-danger-text">
                        <AlertTriangle
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        This order was cancelled.
                    </div>
                ) : order.status === 'return_refund' ? (
                    <div className="rounded-panel border border-warning bg-warning-soft p-3 text-body-sm text-warning-text">
                        <AlertTriangle
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        Return/refund requested. Our team will review your
                        request.
                    </div>
                ) : (
                    <div className="rounded-panel border border-info bg-info-soft p-3 text-body-sm text-info-text">
                        <Truck
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        {latestEvent
                            ? `${latestEvent.title} — ${latestEvent.detail ?? 'In transit'}`
                            : 'Order is being processed.'}
                    </div>
                )}

                {/* 2-column layout */}
                <div className="grid items-start gap-6 lg:grid-cols-2">
                    {/* Left: Timeline Tracking */}
                    <section
                        className="card p-4 md:p-6"
                        aria-labelledby="od-tracking-heading"
                    >
                        <h2 id="od-tracking-heading" className="text-h4">
                            Tracking
                        </h2>
                        <div className="mt-4">
                            <Timeline events={timelineEvents} />
                        </div>
                    </section>

                    {/* Right: Address, Items, Payment, Actions */}
                    <div className="grid gap-4">
                        {/* Address */}
                        {order.address && (
                            <section
                                className="card p-4"
                                aria-labelledby="od-address-heading"
                            >
                                <h2 id="od-address-heading" className="text-h4">
                                    Delivery address
                                </h2>
                                <div className="mt-3 flex gap-3 rounded-panel border border-border bg-surface p-3 md:p-4">
                                    <MapPin
                                        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="text-label font-bold text-foreground">
                                                {order.address.name}
                                            </span>
                                            <span className="tabular text-body-sm text-muted-foreground">
                                                {order.address.phone}
                                            </span>
                                        </p>
                                        <p className="text-body text-muted-foreground">
                                            {order.address.formatted_address}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Items */}
                        <section
                            className="card p-4"
                            aria-labelledby="od-items-heading"
                        >
                            <div className="flex items-center justify-between">
                                <h2 id="od-items-heading" className="text-h4">
                                    Items
                                </h2>
                                {order.shop && (
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/shops/${order.shop.slug}`}
                                            className="flex items-center gap-1 text-body-sm font-bold text-primary-text hover:underline"
                                        >
                                            <Store className="size-3.5" />
                                            <span>{order.shop.name}</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.post('/account/chat', {
                                                    shop_id: order.shop!.id,
                                                })
                                            }
                                            className="inline-flex items-center gap-1 text-body-sm font-bold text-muted-foreground hover:text-primary-text"
                                        >
                                            <MessageCircle className="size-3.5" />
                                            <span>Chat</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ul className="mt-3 divide-y divide-border">
                                {order.items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-start gap-3 py-3"
                                    >
                                        <div className="size-16 shrink-0 overflow-hidden rounded-tile">
                                            {item.product?.images?.[0]?.url ? (
                                                <img
                                                    src={
                                                        item.product.images[0]
                                                            .url
                                                    }
                                                    alt={item.product_name}
                                                    className="aspect-square size-full object-cover"
                                                />
                                            ) : (
                                                <Media
                                                    label={item.product_name}
                                                    icon="package"
                                                    decorative
                                                />
                                            )}
                                        </div>
                                        <div className="grid flex-1 gap-0.5">
                                            <p className="text-body font-bold text-foreground">
                                                {item.product_name}
                                            </p>
                                            {item.variation_label && (
                                                <p className="text-body-sm text-muted-foreground">
                                                    {item.variation_label} · ×
                                                    {item.qty}
                                                </p>
                                            )}
                                            {!item.variation_label && (
                                                <p className="text-body-sm text-muted-foreground">
                                                    Quantity: {item.qty}
                                                </p>
                                            )}

                                            {order.status === 'completed' && (
                                                <div className="mt-1">
                                                    {item.review ? (
                                                        <span className="inline-flex items-center gap-1 text-body-sm text-success-text">
                                                            <CheckCircle2 className="size-3.5" />
                                                            <span>
                                                                Rated (
                                                                {
                                                                    item.review
                                                                        .rating
                                                                }
                                                                ★)
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="neutral"
                                                        >
                                                            <Link
                                                                href={createReview(
                                                                    item.id,
                                                                )}
                                                            >
                                                                Write a review
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <PriceBlock
                                                price={item.subtotal}
                                                size="sm"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Payment details */}
                        <section
                            className="panel p-4"
                            aria-labelledby="od-payment-heading"
                        >
                            <h2 id="od-payment-heading" className="text-h4">
                                Payment details
                            </h2>
                            <dl className="mt-3 grid gap-2 text-body">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Merchandise subtotal (
                                        {order.items.length}{' '}
                                        {order.items.length === 1
                                            ? 'item'
                                            : 'items'}
                                        )
                                    </dt>
                                    <dd className="tabular">
                                        {formatPeso(order.subtotal)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Shipping fee
                                    </dt>
                                    <dd className="tabular">
                                        {formatPeso(order.shipping_fee)}
                                    </dd>
                                </div>
                                {order.shipping_discount > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Shipping discount
                                        </dt>
                                        <dd className="tabular text-promo">
                                            −
                                            {formatPeso(
                                                order.shipping_discount,
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {order.voucher_discount > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Shop voucher
                                        </dt>
                                        <dd className="tabular text-promo">
                                            −
                                            {formatPeso(order.voucher_discount)}
                                        </dd>
                                    </div>
                                )}
                                {order.platform_voucher_discount > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Platform voucher
                                        </dt>
                                        <dd className="tabular text-promo">
                                            −
                                            {formatPeso(
                                                order.platform_voucher_discount,
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {order.cod_fee > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">
                                            Cash on Delivery fee
                                        </dt>
                                        <dd className="tabular">
                                            {formatPeso(order.cod_fee)}
                                        </dd>
                                    </div>
                                )}
                                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                                    <dt className="text-label font-bold text-foreground">
                                        Total payment
                                    </dt>
                                    <dd className="tabular text-price-lg font-bold text-foreground">
                                        {formatPeso(order.total)}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-2 text-body-sm text-muted-foreground">
                                Payment method:{' '}
                                <span className="font-bold text-foreground uppercase">
                                    {order.payment_method}
                                </span>
                            </p>

                            <p className="mt-3 flex items-start gap-2 rounded-tile bg-halal-soft p-2 text-body-sm text-halal">
                                <MoonStar
                                    className="mt-0.5 size-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    Every item in this order is halal certified
                                    or Muslim-friendly.
                                </span>
                            </p>
                        </section>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                            {isToReceive && (
                                <Button
                                    size="lg"
                                    onClick={handleMarkReceived}
                                    className="flex-1"
                                >
                                    Order received
                                </Button>
                            )}

                            {isCancellable && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setCancelModalOpen(true)}
                                    className="border-danger text-danger-text"
                                >
                                    Cancel order
                                </Button>
                            )}

                            {isReturnable && (
                                <Button
                                    variant="neutral"
                                    size="lg"
                                    onClick={() => setReturnModalOpen(true)}
                                    className="w-full"
                                >
                                    Return / refund
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal
                open={cancelModalOpen}
                onOpenChange={setCancelModalOpen}
                title="Cancel Order"
                kind="modal"
            >
                <div className="grid gap-4">
                    <p className="text-body text-muted-foreground">
                        Are you sure you want to cancel this order? This action
                        cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="neutral"
                            onClick={() => setCancelModalOpen(false)}
                            disabled={processing}
                        >
                            Keep order
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancelOrder}
                            disabled={processing}
                        >
                            {processing
                                ? 'Cancelling...'
                                : 'Confirm cancellation'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Return / Refund Modal */}
            <Modal
                open={returnModalOpen}
                onOpenChange={setReturnModalOpen}
                title="Request Return / Refund"
                kind="modal"
            >
                <form onSubmit={handleReturnSubmit} className="grid gap-4">
                    <p className="text-body text-muted-foreground">
                        Please state the reason why you are requesting a return
                        or refund for this order.
                    </p>
                    <TextArea
                        rows={4}
                        value={returnReason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setReturnReason(e.target.value)
                        }
                        placeholder="e.g. Received incorrect item, damaged parcel, missing accessories..."
                        required
                        maxLength={500}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="neutral"
                            type="button"
                            onClick={() => setReturnModalOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !returnReason.trim()}
                        >
                            {processing ? 'Submitting...' : 'Submit request'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

OrderDetail.layout = {
    breadcrumbs: [{ title: 'My Purchases', href: '/account/orders' }],
};
