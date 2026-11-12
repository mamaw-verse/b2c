import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import { MessageCircle, Printer, Truck } from 'lucide-react';
import { useState } from 'react';
import { FulfillmentCard } from '@/components/fulfillment-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TextArea } from '@/components/ui/textarea';
import { formatDateTime, formatPeso } from '@/lib/format';
import { index as ordersIndex } from '@/routes/seller/orders';
import { store as storeChat } from '@/routes/seller/orders/chat';
import {
    store as storeFulfillment,
    update as updateFulfillment,
} from '@/routes/seller/orders/fulfillments';
import { store as storeReturn } from '@/routes/seller/orders/return';

type OrderItem = {
    id: string;
    name: string;
    slug?: string | null;
    variation?: string | null;
    sku?: string | null;
    quantity: number;
    price: number;
    subtotal: number;
    thumbnail_icon?: string;
    frozen: boolean;
    remaining: number;
};

type Fulfillment = {
    id: string;
    courier_name: string;
    tracking_number: string;
    tracking_url?: string | null;
    status: string;
    shipped_at: string;
    delivered_at?: string | null;
    items: {
        order_item_id: string;
        name: string;
        quantity: number;
        unit_price?: number;
        variation?: string | null;
        thumbnail_icon?: string | null;
        slug?: string | null;
        sku?: string | null;
    }[];
};

type OrderDetail = {
    id: string;
    reference: string;
    raw_id: string;
    location?: string | null;
    status: string;
    status_raw: string;
    status_variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    created_at: string;
    buyer: { id: string; name: string; email: string };
    shipping_address: {
        recipient_name?: string | null;
        phone?: string | null;
        street?: string | null;
        formatted?: string | null;
        landmark?: string | null;
    };
    shipping_option: {
        name: string;
        description?: string | null;
        fee: number;
        is_cold_chain: boolean;
    };
    payment: {
        method: string;
        method_raw: string;
        cod_collect_amount: number | null;
        subtotal: number;
        shipping: number;
        shipping_discount: number;
        voucher_discount: number;
        platform_voucher_discount: number;
        cod_fee: number;
        total: number;
    };
    items: OrderItem[];
    timeline: {
        title?: string | null;
        detail?: string | null;
        time?: string | null;
        courier_name?: string | null;
        tracking_number?: string | null;
        tracking_url?: string | null;
        state?: string | null;
    }[];
    fulfillment_status: string;
    fulfillments: Fulfillment[];
    chat_url: string | null;
    can_ship: boolean;
    can_resolve_return: boolean;
    return_request: {
        reason: string | null;
        requested_at: string | null;
    } | null;
};

type PageProps = {
    order: OrderDetail;
};

export default function SellerOrderShow({ order }: PageProps) {
    const [shipModalOpen, setShipModalOpen] = useState(false);
    const [editing, setEditing] = useState<Fulfillment | null>(null);
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineNote, setDeclineNote] = useState('');
    const [resolveProcessing, setResolveProcessing] = useState(false);

    const unfulfilledItems = order.items
        .filter((item) => item.remaining > 0)
        .map((item) => ({
            name: item.name,
            variation: item.variation,
            sku: item.sku,
            thumbnail_icon: item.thumbnail_icon,
            unit_price: item.price,
            quantity: item.remaining,
        }));
    const totalRemainingQty = unfulfilledItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );
    const shipForm = useForm({
        courier_name: '',
        tracking_number: '',
        tracking_url: '',
        items: order.items
            .filter((item) => item.remaining > 0)
            .map((item) => ({
                order_item_id: item.id,
                quantity: item.remaining,
            })),
    });

    const submitShipment = () => {
        shipForm.transform((data) => ({
            ...data,
            items: data.items.filter((line) => line.quantity > 0),
        }));
        shipForm.post(storeFulfillment({ order: order.raw_id }).url, {
            onSuccess: () => {
                setShipModalOpen(false);
                shipForm.reset();
            },
        });
    };

    const handleApproveReturn = () => {
        if (!confirm('Approve this refund request?')) return;
        setResolveProcessing(true);
        router.post(
            storeReturn({ order: order.raw_id }).url,
            { decision: 'approve' },
            { onFinish: () => setResolveProcessing(false) },
        );
    };

    const handleDeclineReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!declineNote.trim()) return;
        setResolveProcessing(true);
        router.post(
            storeReturn({ order: order.raw_id }).url,
            { decision: 'reject', note: declineNote },
            {
                onFinish: () => {
                    setResolveProcessing(false);
                    setDeclineModalOpen(false);
                },
            },
        );
    };

    return (
        <>
            <Head title={`Order ${order.id}`} />
            <div className="mx-auto max-w-container p-gutter py-8">
                {/* Breadcrumb */}
                <nav className="mb-4 flex items-center gap-1 text-body-sm text-muted-foreground">
                    <Link
                        href={ordersIndex().url}
                        className="hover:text-foreground hover:underline"
                    >
                        Orders
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-foreground">{order.id}</span>
                </nav>

                <div className="grid gap-6 pb-24 lg:pb-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-h1">Order {order.reference}</h1>
                            <p className="mt-1 text-body text-muted-foreground">
                                Placed on {formatDateTime(order.created_at)}
                            </p>
                        </div>
                        <Badge variant={order.status_variant}>
                            {order.status}
                        </Badge>
                    </div>

                    {/* Unfulfilled Card */}
                    {totalRemainingQty > 0 && (
                        <FulfillmentCard
                            title={`Unfulfilled (${totalRemainingQty})`}
                            badge={{ label: 'Unfulfilled', tone: 'yellow' }}
                            location={order.location}
                            lines={unfulfilledItems}
                            footer={
                                order.can_ship ? (
                                    <Button
                                        onClick={() => setShipModalOpen(true)}
                                    >
                                        <Truck
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Fulfill items
                                    </Button>
                                ) : null
                            }
                        />
                    )}

                    {order.can_resolve_return && order.return_request && (
                        <section className="panel p-4 md:p-6">
                            <h2 className="mb-3 text-h3">
                                Return/refund request
                            </h2>
                            {order.return_request.reason && (
                                <p className="mb-4 text-body text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        Buyer reason:
                                    </span>{' '}
                                    {order.return_request.reason}
                                </p>
                            )}
                            {order.return_request.requested_at && (
                                <p className="mb-4 text-body-sm text-muted-foreground">
                                    Requested on{' '}
                                    {formatDateTime(
                                        order.return_request.requested_at,
                                    )}
                                </p>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleApproveReturn}
                                    disabled={resolveProcessing}
                                >
                                    Approve refund
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeclineModalOpen(true)}
                                    disabled={resolveProcessing}
                                >
                                    Decline
                                </Button>
                            </div>
                        </section>
                    )}

                    {/* Parcels */}
                    {order.fulfillments.map((parcel, index) => (
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
                                name: line.name,
                                variation: line.variation,
                                sku: line.sku,
                                thumbnail_icon: line.thumbnail_icon,
                                unit_price: line.unit_price ?? 0,
                                quantity: line.quantity,
                            }))}
                            footer={
                                parcel.status === 'shipped' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditing(parcel)}
                                    >
                                        Edit tracking
                                    </Button>
                                ) : null
                            }
                            data-test="parcel"
                        />
                    ))}

                    {/* Payment */}
                    <section className="panel p-4 md:p-6">
                        <h2 className="mb-3 text-h3">Payment</h2>
                        <div className="flex justify-between text-body">
                            <span className="text-muted-foreground">
                                Method
                            </span>
                            <span>{order.payment.method}</span>
                        </div>
                        {order.payment.cod_collect_amount !== null && (
                            <p className="mt-2 rounded-tile bg-surface-subtle p-2 text-body-sm">
                                COD — collect{' '}
                                <span className="font-bold">
                                    {formatPeso(
                                        order.payment.cod_collect_amount,
                                    )}
                                </span>{' '}
                                from buyer
                            </p>
                        )}
                        <div className="mt-4 border-t border-border pt-4">
                            <div className="flex justify-between text-body">
                                <span>Subtotal</span>
                                <span>
                                    {formatPeso(order.payment.subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-body text-muted-foreground">
                                <span>Shipping</span>
                                <span>
                                    {formatPeso(order.payment.shipping)}
                                </span>
                            </div>
                            {order.payment.shipping_discount > 0 && (
                                <div className="flex justify-between text-body text-muted-foreground">
                                    <span>Shipping discount</span>
                                    <span>
                                        −
                                        {formatPeso(
                                            order.payment.shipping_discount,
                                        )}
                                    </span>
                                </div>
                            )}
                            {order.payment.voucher_discount > 0 && (
                                <div className="flex justify-between text-body text-muted-foreground">
                                    <span>Shop voucher</span>
                                    <span>
                                        −
                                        {formatPeso(
                                            order.payment.voucher_discount,
                                        )}
                                    </span>
                                </div>
                            )}
                            {order.payment.platform_voucher_discount > 0 && (
                                <div className="flex justify-between text-body text-muted-foreground">
                                    <span>Platform voucher</span>
                                    <span>
                                        −
                                        {formatPeso(
                                            order.payment
                                                .platform_voucher_discount,
                                        )}
                                    </span>
                                </div>
                            )}
                            {order.payment.cod_fee > 0 && (
                                <div className="flex justify-between text-body text-muted-foreground">
                                    <span>COD fee (collect from buyer)</span>
                                    <span>
                                        {formatPeso(order.payment.cod_fee)}
                                    </span>
                                </div>
                            )}
                            <div className="mt-2 flex justify-between text-h3">
                                <span>Total</span>
                                <span>{formatPeso(order.payment.total)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Shipping address */}
                    <section className="panel p-4 md:p-6">
                        <h2 className="mb-3 text-h3">Shipping address</h2>
                        <address className="text-body not-italic">
                            <p className="font-medium">
                                {order.shipping_address.recipient_name}
                            </p>
                            <p>{order.shipping_address.phone}</p>
                            <p>{order.shipping_address.formatted}</p>
                            {order.shipping_address.landmark && (
                                <p className="text-muted-foreground">
                                    Landmark: {order.shipping_address.landmark}
                                </p>
                            )}
                        </address>
                    </section>

                    {/* Timeline */}
                    {order.timeline.length > 0 && (
                        <section className="panel p-4 md:p-6">
                            <h2 className="mb-4 text-h3">Timeline</h2>
                            <ol className="relative ml-3 border-l border-border">
                                {order.timeline.map((event, i) => (
                                    <li key={i} className="mb-4 ml-4 last:mb-0">
                                        <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-surface bg-border" />
                                        <p className="text-label">
                                            {event.title}
                                        </p>
                                        {event.detail && (
                                            <p className="text-body-sm text-muted-foreground">
                                                {event.detail}
                                            </p>
                                        )}
                                        <time className="text-caption text-muted-foreground">
                                            {event.time &&
                                                formatDateTime(event.time)}
                                        </time>
                                        {event.tracking_url ? (
                                            <p className="mt-1">
                                                <a
                                                    href={event.tracking_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-label text-halal hover:underline"
                                                >
                                                    Track parcel ↗
                                                </a>
                                            </p>
                                        ) : event.tracking_number ? (
                                            <p className="mt-1 text-body-sm text-muted-foreground">
                                                Tracking:{' '}
                                                {event.tracking_number}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </div>
            </div>

            {/* Action bar (sticky on mobile, fixed on desktop) */}
            <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] z-sticky-bar border-t border-border bg-surface px-[var(--gutter)] pt-3 pb-safe md:bottom-0 lg:left-[var(--sidebar-w)]">
                <div className="mx-auto flex max-w-container items-center gap-2">
                    {order.chat_url ? (
                        <Link
                            href={order.chat_url}
                            className="btn btn-icon btn-ghost text-foreground"
                            aria-label="Chat with buyer"
                        >
                            <MessageCircle
                                className="size-5"
                                aria-hidden="true"
                            />
                        </Link>
                    ) : (
                        <Link
                            href={storeChat({ order: order.raw_id }).url}
                            method="post"
                            as="button"
                            className="btn btn-icon btn-ghost text-foreground"
                            aria-label="Chat with buyer"
                        >
                            <MessageCircle
                                className="size-5"
                                aria-hidden="true"
                            />
                        </Link>
                    )}
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Print waybill</span>
                    </button>
                    {order.can_ship && (
                        <Button
                            onClick={() => setShipModalOpen(true)}
                            className="ml-auto"
                        >
                            <Truck className="size-4" aria-hidden="true" />
                            Arrange shipment
                        </Button>
                    )}
                </div>
            </div>

            <Modal
                open={shipModalOpen}
                onOpenChange={setShipModalOpen}
                title="Arrange shipment"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitShipment();
                    }}
                    className="grid gap-4"
                >
                    <p className="text-body text-muted-foreground">
                        Choose the quantities in this parcel. Items left at 0
                        ship in a later parcel.
                    </p>
                    {shipForm.data.items.map((line, index) => {
                        const item = order.items.find(
                            (i) => i.id === line.order_item_id,
                        );

                        return (
                            <FormField
                                key={line.order_item_id}
                                label={`${item?.name} (max ${item?.remaining})`}
                                error={
                                    shipForm.errors[
                                        `items.${index}.quantity` as keyof typeof shipForm.errors
                                    ]
                                }
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    max={item?.remaining}
                                    value={line.quantity}
                                    onChange={(e) =>
                                        shipForm.setData(
                                            'items',
                                            shipForm.data.items.map((l, i) =>
                                                i === index
                                                    ? {
                                                          ...l,
                                                          quantity: Number(
                                                              e.target.value,
                                                          ),
                                                      }
                                                    : l,
                                            ),
                                        )
                                    }
                                />
                            </FormField>
                        );
                    })}
                    <FormField
                        label="Courier"
                        required
                        error={shipForm.errors.courier_name}
                    >
                        <Input
                            name="courier_name"
                            placeholder="e.g. J&T Express"
                            value={shipForm.data.courier_name}
                            onChange={(e) =>
                                shipForm.setData('courier_name', e.target.value)
                            }
                        />
                    </FormField>
                    <FormField
                        label="Tracking number"
                        required
                        error={shipForm.errors.tracking_number}
                    >
                        <Input
                            name="tracking_number"
                            placeholder="e.g. PH-123456789"
                            value={shipForm.data.tracking_number}
                            onChange={(e) =>
                                shipForm.setData(
                                    'tracking_number',
                                    e.target.value,
                                )
                            }
                        />
                    </FormField>
                    <FormField
                        label="Tracking link"
                        error={shipForm.errors.tracking_url}
                    >
                        <Input
                            name="tracking_url"
                            type="url"
                            placeholder="https://"
                            value={shipForm.data.tracking_url}
                            onChange={(e) =>
                                shipForm.setData('tracking_url', e.target.value)
                            }
                        />
                    </FormField>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShipModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={shipForm.processing}>
                            <Truck className="size-4" aria-hidden="true" />
                            Confirm shipment
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
                title="Edit tracking"
            >
                {editing && (
                    <Form
                        action={
                            updateFulfillment({
                                order: order.raw_id,
                                fulfillment: editing.id,
                            }).url
                        }
                        method="put"
                        onSuccess={() => setEditing(null)}
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-4">
                                <FormField
                                    label="Courier"
                                    required
                                    error={errors.courier_name}
                                >
                                    <Input
                                        name="courier_name"
                                        defaultValue={editing.courier_name}
                                    />
                                </FormField>
                                <FormField
                                    label="Tracking number"
                                    required
                                    error={errors.tracking_number}
                                >
                                    <Input
                                        name="tracking_number"
                                        defaultValue={editing.tracking_number}
                                    />
                                </FormField>
                                <FormField
                                    label="Tracking link"
                                    error={errors.tracking_url}
                                >
                                    <Input
                                        name="tracking_url"
                                        type="url"
                                        defaultValue={
                                            editing.tracking_url ?? ''
                                        }
                                    />
                                </FormField>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing}>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                )}
            </Modal>

            <Modal
                open={declineModalOpen}
                onOpenChange={(open) => !open && setDeclineModalOpen(false)}
                title="Decline return/refund"
            >
                <form onSubmit={handleDeclineReturn} className="grid gap-4">
                    <FormField label="Reason for declining" required>
                        <TextArea
                            value={declineNote}
                            onChange={(e) => setDeclineNote(e.target.value)}
                            maxLength={500}
                            rows={4}
                            placeholder="Explain why you are declining this request…"
                        />
                    </FormField>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeclineModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={resolveProcessing || !declineNote.trim()}
                        >
                            Decline
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
