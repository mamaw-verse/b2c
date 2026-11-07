import { Form, Head, Link } from '@inertiajs/react';
import { MessageCircle, Printer, Truck } from 'lucide-react';
import { useState } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatPeso } from '@/lib/format';
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
    raw_id: string;
    status: string;
    status_raw: string;
    created_at: string;
    buyer: { id: string; name: string; email: string };
    shipping_address: {
        recipient_name?: string | null;
        phone?: string | null;
        street?: string | null;
        barangay?: string | null;
        city?: string | null;
        province?: string | null;
        postal_code?: string | null;
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
        subtotal: number;
        shipping_fee: number;
        voucher_discount: number;
        total: number;
    };
    items: OrderItem[];
    timeline: {
        title?: string | null;
        detail?: string | null;
        time?: string | null;
        state?: string | null;
    }[];
    can_ship: boolean;
};

type PageProps = {
    order: OrderDetail;
};

function statusVariant(status: string) {
    const map: Record<
        string,
        'neutral' | 'info' | 'warning' | 'success' | 'danger'
    > = {
        Pending: 'neutral',
        'To Pay': 'warning',
        'To Ship': 'info',
        Shipped: 'info',
        'To Receive': 'neutral',
        Completed: 'success',
        Cancelled: 'danger',
        Refunded: 'neutral',
    };
    return map[status] ?? 'neutral';
}

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
                            <h1 className="text-h1">Order {order.id}</h1>
                            <p className="mt-1 text-body text-muted-foreground">
                                Placed on {order.created_at}
                            </p>
                        </div>
                        <Badge variant={statusVariant(order.status)}>
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
                                            name={item.thumbnail_icon ?? 'package'}
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
                                    {formatPeso(order.payment.shipping_fee)}
                                </span>
                            </div>
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
                            <p>{order.shipping_address.street}</p>
                            <p>
                                {order.shipping_address.barangay},{' '}
                                {order.shipping_address.city},{' '}
                                {order.shipping_address.province}{' '}
                                {order.shipping_address.postal_code}
                            </p>
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
                                    <li
                                        key={i}
                                        className="mb-4 ml-4 last:mb-0"
                                    >
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
                                            {event.time}
                                        </time>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </div>
            </div>

            {/* Action bar (sticky on mobile, fixed on desktop) */}
            <div className="fixed inset-x-0 bottom-0 z-sticky-bar border-t border-border bg-surface px-gutter pt-3 pb-safe lg:left-[var(--sidebar-w)]">
                <div className="mx-auto flex max-w-container items-center gap-2">
                    <Link
                        href={`/chat?buyer=${order.buyer.id}`}
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
                footer={
                    <Form
                        action={storeShipment({ order: order.raw_id }).url}
                        method="post"
                    >
                        {({ processing }) => (
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
                        )}
                    </Form>
                }
            >
                <p className="text-body text-muted-foreground">
                    Mark order {order.id} as shipped and notify the buyer?
                </p>
            </Modal>
        </>
    );
}
