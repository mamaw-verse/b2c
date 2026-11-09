import { Form, Head, Link } from '@inertiajs/react';
import { MessageCircle, Printer, Truck } from 'lucide-react';
import { useState } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDateTime, formatPeso } from '@/lib/format';
import { index as ordersIndex } from '@/routes/seller/orders';
import { store as storeShipment } from '@/routes/seller/orders/shipment';

type OrderItem = {
    id: string;
    name: string;
    variation?: string | null;
    quantity: number;
    price: number;
    subtotal: number;
    thumbnail_icon?: string;
    frozen: boolean;
};

type OrderDetail = {
    id: string;
    reference: string;
    raw_id: string;
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
        state?: string | null;
    }[];
    can_ship: boolean;
};

type PageProps = {
    order: OrderDetail;
};

export default function SellerOrderShow({ order }: PageProps) {
    const [shipModalOpen, setShipModalOpen] = useState(false);

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

                    {/* Items */}
                    <section className="panel p-4 md:p-6">
                        <h2 className="mb-4 text-h3">Items</h2>
                        <ul className="grid gap-4">
                            {order.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3"
                                >
                                    <span className="bg-surface-raised grid size-12 shrink-0 place-items-center rounded-tile text-muted-foreground">
                                        <DsIcon
                                            name={
                                                item.thumbnail_icon ?? 'package'
                                            }
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-label">
                                            {item.name}
                                        </p>
                                        {item.variation && (
                                            <p className="text-body-sm text-muted-foreground">
                                                {item.variation}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-end">
                                        <p className="text-label">
                                            {formatPeso(item.price)}
                                        </p>
                                        <p className="text-body-sm text-muted-foreground">
                                            × {item.quantity}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

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
                    <Link
                        href={`/seller/chat?buyer=${order.buyer.id}`}
                        className="btn btn-icon btn-ghost text-foreground"
                        aria-label="Chat with buyer"
                    >
                        <MessageCircle className="size-5" aria-hidden="true" />
                    </Link>
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

            {/* Shipment confirmation modal */}
            <Modal
                open={shipModalOpen}
                onOpenChange={setShipModalOpen}
                title="Arrange shipment"
            >
                <Form
                    action={storeShipment({ order: order.raw_id }).url}
                    method="post"
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-4">
                            <p className="text-body text-muted-foreground">
                                Mark order {order.reference} as shipped and
                                notify the buyer?
                            </p>
                            <FormField
                                label="Courier"
                                required
                                error={errors.courier_name}
                            >
                                <Input
                                    name="courier_name"
                                    placeholder="e.g. J&T Express"
                                />
                            </FormField>
                            <FormField
                                label="Tracking number"
                                required
                                error={errors.tracking_number}
                            >
                                <Input
                                    name="tracking_number"
                                    placeholder="e.g. PH-123456789"
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
                                <Button type="submit" disabled={processing}>
                                    <Truck
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Confirm shipment
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>
        </>
    );
}
