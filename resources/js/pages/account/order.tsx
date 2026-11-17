import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    Image,
    MapPin,
    MessageCircle,
    MoonStar,
    PackageCheck,
    Store,
    Truck,
    Video,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { FulfillmentCard } from '@/components/fulfillment-card';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { Timeline, type TimelineEvent } from '@/components/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TextArea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import { create as createReview } from '@/routes/reviews';

type RefundLine = {
    id: string;
    amount: number;
    reference?: string | null;
    processed_at?: string | null;
    items: {
        product_name?: string | null;
        variation?: string | null;
        unit_price: number;
        qty: number;
    }[];
};

type ReturnProofs = {
    photos: string[];
    video?: string | null;
} | null;

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
        fulfillments?: {
            id: string;
            courier_name: string;
            tracking_number: string;
            tracking_url?: string | null;
            status: string;
            shipped_at: string;
            delivered_at?: string | null;
            items: {
                id: string;
                quantity: number;
                order_item?: {
                    product_name: string;
                    product?: { images?: { url: string }[] } | null;
                } | null;
            }[];
        }[];
        fulfillment_status?: string;
        events?: {
            id: string;
            title: string;
            detail?: string | null;
            location?: string | null;
            tracking_number?: string | null;
            tracking_url?: string | null;
            help_url?: string | null;
            created_at: string;
        }[];
        items: {
            id: string;
            product_name: string;
            variation_label?: string | null;
            unit_price: number;
            qty: number;
            refunded_quantity: number;
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
    return_outcome?: {
        status: 'approved' | 'declined' | 'processed';
        reference?: string | null;
        note?: string | null;
    } | null;
    refunds?: RefundLine[];
    return_proofs?: ReturnProofs;
};

export default function OrderDetail({
    order,
    return_outcome,
    refunds = [],
    return_proofs,
}: OrderDetailPageProps) {
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [returnItems, setReturnItems] = useState<Record<string, number>>(
        Object.fromEntries(
            order.items.map((item) => [
                item.id,
                item.qty - item.refunded_quantity,
            ]),
        ),
    );
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [refundModalOpen, setRefundModalOpen] = useState(false);

    // Proof file state
    const [photos, setPhotos] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const isCancellable =
        ['pending', 'to_pay', 'to_ship'].includes(order.status) &&
        (order.fulfillment_status ?? 'unfulfilled') === 'unfulfilled';
    const isReturnable = order.status === 'completed';
    const isToReceive = order.status === 'to_receive';
    const hasRefunds = refunds.length > 0;

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
        if (photos.length < 2) return;

        setProcessing(true);

        const formData = new FormData();
        formData.append('reason', returnReason);

        order.items
            .filter((item) => (returnItems[item.id] ?? 0) > 0)
            .forEach((item, index) => {
                formData.append(`items[${index}][order_item_id]`, item.id);
                formData.append(
                    `items[${index}][qty]`,
                    String(returnItems[item.id]),
                );
            });

        photos.forEach((photo) => formData.append('photos[]', photo));
        if (video) formData.append('video', video);

        router.post(`/account/orders/${order.id}/return`, formData, {
            forceFormData: true,
            onFinish: () => {
                setProcessing(false);
                setReturnModalOpen(false);
            },
        });
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
                  tracking_number: evt.tracking_number,
                  tracking_url: evt.tracking_url,
                  help_url: evt.help_url,
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
                        Return/refund requested. Awaiting seller review.
                    </div>
                ) : order.status === 'refunded' ? (
                    <div className="rounded-panel border border-success bg-success-soft p-3 text-body-sm text-success-text">
                        <CheckCircle2
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        {return_outcome?.status === 'processed' &&
                        return_outcome.reference
                            ? `Refunded (ref: ${return_outcome.reference})`
                            : 'Refund approved'}
                        {hasRefunds && (
                            <button
                                type="button"
                                onClick={() => setRefundModalOpen(true)}
                                className="ml-2 font-bold underline"
                            >
                                View details
                            </button>
                        )}
                    </div>
                ) : return_outcome?.status === 'processed' ? (
                    <div className="rounded-panel border border-success bg-success-soft p-3 text-body-sm text-success-text">
                        <CheckCircle2
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        Refunded
                        {return_outcome.reference
                            ? ` (ref: ${return_outcome.reference})`
                            : ''}
                        {hasRefunds && (
                            <button
                                type="button"
                                onClick={() => setRefundModalOpen(true)}
                                className="ml-2 font-bold underline"
                            >
                                View details
                            </button>
                        )}
                    </div>
                ) : return_outcome?.status === 'declined' ? (
                    <div className="rounded-panel border border-danger bg-danger-soft p-3 text-body-sm text-danger-text">
                        <AlertTriangle
                            className="mr-1.5 inline size-4 align-[-0.15em]"
                            aria-hidden="true"
                        />
                        Return/refund declined.
                        {return_outcome.note && (
                            <> Reason: {return_outcome.note}</>
                        )}
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

                        {order.fulfillments &&
                            order.fulfillments.length > 0 &&
                            order.fulfillments.map((parcel, index) => (
                                <FulfillmentCard
                                    key={parcel.id}
                                    title={`Parcel ${index + 1} · ${parcel.courier_name}`}
                                    badge={{
                                        label:
                                            parcel.status === 'delivered'
                                                ? 'Delivered'
                                                : 'Shipped',
                                        tone:
                                            parcel.status === 'delivered'
                                                ? 'green'
                                                : 'blue',
                                    }}
                                    tracking={{
                                        courier: parcel.courier_name,
                                        number: parcel.tracking_number,
                                        url: parcel.tracking_url,
                                        shipped_at: parcel.shipped_at,
                                        delivered_at: parcel.delivered_at,
                                    }}
                                    lines={parcel.items.map((line) => ({
                                        name:
                                            line.order_item?.product_name ??
                                            'Item',
                                        variation:
                                            (line as any).variation ??
                                            line.order_item?.product_name,
                                        sku: (line as any).sku,
                                        thumbnail_icon:
                                            (line as any).thumbnail_icon ??
                                            'package',
                                        thumbnail:
                                            line.order_item?.product?.images?.find(
                                                (image) => image.url,
                                            )?.url ?? null,
                                        unit_price:
                                            (line as any).unit_price ?? 0,
                                        quantity: line.quantity,
                                    }))}
                                    footer={
                                        parcel.tracking_url ? (
                                            <Button asChild size="sm">
                                                <a
                                                    href={parcel.tracking_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Truck className="size-4" />
                                                    Track order
                                                </a>
                                            </Button>
                                        ) : undefined
                                    }
                                    data-test="parcel"
                                />
                            ))}

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

                            {hasRefunds && !isReturnable && (
                                <Button
                                    variant="neutral"
                                    size="lg"
                                    onClick={() => setRefundModalOpen(true)}
                                    className="w-full"
                                >
                                    <PackageCheck className="size-4" />
                                    View refund details
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
                    <fieldset className="grid gap-2">
                        <legend className="text-label font-semibold">
                            Items and quantities
                        </legend>
                        {order.items
                            .filter((item) => item.qty > item.refunded_quantity)
                            .map((item) => {
                                const available =
                                    item.qty - item.refunded_quantity;
                                const selected =
                                    (returnItems[item.id] ?? 0) > 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 rounded-tile border border-border p-3"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            aria-label={`Request refund for ${item.product_name}`}
                                            onChange={(event) =>
                                                setReturnItems((current) => ({
                                                    ...current,
                                                    [item.id]: event.target
                                                        .checked
                                                        ? available
                                                        : 0,
                                                }))
                                            }
                                        />
                                        <span className="min-w-0 flex-1 text-body-sm">
                                            {item.product_name}
                                            {item.variation_label && (
                                                <span className="text-muted-foreground">
                                                    {' · '}
                                                    {item.variation_label}
                                                </span>
                                            )}
                                        </span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={available}
                                            value={
                                                selected
                                                    ? returnItems[item.id]
                                                    : 0
                                            }
                                            disabled={!selected}
                                            aria-label={`Quantity of ${item.product_name}`}
                                            className="input w-20"
                                            onChange={(event) =>
                                                setReturnItems((current) => ({
                                                    ...current,
                                                    [item.id]: Math.min(
                                                        available,
                                                        Math.max(
                                                            0,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    ),
                                                }))
                                            }
                                        />
                                    </div>
                                );
                            })}
                    </fieldset>
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

                    {/* Proof attachments */}
                    <div className="grid gap-3">
                        <div>
                            <p className="text-label font-semibold">
                                Photos{' '}
                                <span className="text-danger-text">*</span>
                            </p>
                            <p className="mt-0.5 text-body-sm text-muted-foreground">
                                At least 2 photos required (max 5, up to 10 MB
                                each)
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {photos.map((photo, i) => (
                                    <div
                                        key={i}
                                        className="relative size-20 overflow-hidden rounded-tile border border-border"
                                    >
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`Proof photo ${i + 1}`}
                                            className="size-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            aria-label={`Remove photo ${i + 1}`}
                                            onClick={() =>
                                                setPhotos((prev) =>
                                                    prev.filter(
                                                        (_, idx) => idx !== i,
                                                    ),
                                                )
                                            }
                                            className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {photos.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            photoInputRef.current?.click()
                                        }
                                        className="flex size-20 flex-col items-center justify-center gap-1 rounded-tile border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                                    >
                                        <Image className="size-5" />
                                        <span className="text-caption">
                                            Add photo
                                        </span>
                                    </button>
                                )}
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        const files = Array.from(
                                            e.target.files ?? [],
                                        );
                                        setPhotos((prev) =>
                                            [
                                                ...prev,
                                                ...files,
                                            ].slice(0, 5),
                                        );
                                        e.target.value = '';
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-label font-semibold">
                                Video{' '}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </p>
                            <p className="mt-0.5 text-body-sm text-muted-foreground">
                                One video up to 50 MB (MP4, MOV, or WebM)
                            </p>
                            {video ? (
                                <div className="mt-2 flex items-center gap-2 rounded-tile border border-border p-2">
                                    <Video className="size-5 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate text-body-sm">
                                        {video.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setVideo(null)}
                                        className="text-body-sm text-danger-text hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        videoInputRef.current?.click()
                                    }
                                    className="mt-2 flex items-center gap-2 rounded-tile border border-dashed border-border p-2 text-body-sm text-muted-foreground hover:border-primary hover:text-primary"
                                >
                                    <Video className="size-4" />
                                    Attach video
                                </button>
                            )}
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setVideo(file);
                                    e.target.value = '';
                                }}
                            />
                        </div>
                    </div>

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
                            disabled={
                                processing ||
                                !returnReason.trim() ||
                                photos.length < 2 ||
                                Object.values(returnItems).every(
                                    (qty) => qty <= 0,
                                )
                            }
                        >
                            {processing ? 'Submitting...' : 'Submit request'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Refund Details Modal */}
            <Modal
                open={refundModalOpen}
                onOpenChange={setRefundModalOpen}
                title="Refund Details"
                kind="modal"
            >
                <div className="grid gap-4">
                    {refunds.length === 0 ? (
                        <p className="text-body text-muted-foreground">
                            No refunds processed yet.
                        </p>
                    ) : (
                        refunds.map((refund, i) => (
                            <div
                                key={refund.id}
                                className="rounded-panel border border-border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-label font-semibold">
                                        Refund {refunds.length > 1 ? i + 1 : ''}
                                    </p>
                                    <p className="tabular text-price font-bold text-success-text">
                                        {formatPeso(refund.amount)}
                                    </p>
                                </div>

                                {refund.items.length > 0 && (
                                    <ul className="mb-3 divide-y divide-border">
                                        {refund.items.map((line, j) => (
                                            <li
                                                key={j}
                                                className="flex items-baseline justify-between gap-3 py-1.5 text-body-sm"
                                            >
                                                <span className="min-w-0 flex-1 text-foreground">
                                                    {line.product_name}
                                                    {line.variation && (
                                                        <span className="text-muted-foreground">
                                                            {' · '}
                                                            {line.variation}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="shrink-0 text-muted-foreground">
                                                    ×{line.qty} ·{' '}
                                                    {formatPeso(
                                                        line.unit_price *
                                                            line.qty,
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <dl className="grid gap-1 text-body-sm text-muted-foreground">
                                    {refund.reference && (
                                        <div className="flex justify-between gap-2">
                                            <dt>Reference</dt>
                                            <dd className="tabular font-medium text-foreground">
                                                {refund.reference}
                                            </dd>
                                        </div>
                                    )}
                                    {refund.processed_at && (
                                        <div className="flex justify-between gap-2">
                                            <dt>Processed</dt>
                                            <dd>
                                                {formatDateTime(
                                                    refund.processed_at,
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        ))
                    )}

                    {/* Show proofs if the buyer submitted them */}
                    {return_proofs &&
                        (return_proofs.photos.length > 0 ||
                            return_proofs.video) && (
                            <div>
                                <p className="mb-2 text-label font-semibold">
                                    Submitted proofs
                                </p>
                                {return_proofs.photos.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {return_proofs.photos.map(
                                            (src, idx) => (
                                                <a
                                                    key={idx}
                                                    href={src}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="size-20 overflow-hidden rounded-tile border border-border"
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Proof ${idx + 1}`}
                                                        className="size-full object-cover"
                                                    />
                                                </a>
                                            ),
                                        )}
                                    </div>
                                )}
                                {return_proofs.video && (
                                    <a
                                        href={return_proofs.video}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-body-sm font-medium text-primary-text hover:underline"
                                    >
                                        <Video className="size-4" />
                                        View video proof
                                    </a>
                                )}
                            </div>
                        )}

                    <div className="flex justify-end">
                        <Button
                            variant="neutral"
                            onClick={() => setRefundModalOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

OrderDetail.layout = {
    breadcrumbs: [{ title: 'My Purchases', href: '/account/orders' }],
};
