import { Link } from '@inertiajs/react';
import { ChevronRight, Store, Truck } from 'lucide-react';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';

export type OrderItemData = {
    id: string;
    product_name: string;
    variation_label?: string | null;
    unit_price: number;
    qty: number;
    subtotal: number;
    image_url?: string | null;
    product_slug?: string;
    reviewed?: boolean;
};

export type OrderData = {
    id: string;
    status:
        | 'pending'
        | 'to_pay'
        | 'to_ship'
        | 'to_receive'
        | 'completed'
        | 'cancelled'
        | 'return_refund';
    status_label?: string;
    shop?: {
        name: string;
        slug?: string;
    } | null;
    tracking_note?: string | null;
    total: number;
    items: OrderItemData[];
    created_at?: string;
};

export type OrderCardProps = {
    order: OrderData;
    onReceive?: (orderId: string) => void;
    onCancel?: (orderId: string) => void;
    className?: string;
};

export function OrderCard({
    order,
    onReceive,
    className = '',
}: OrderCardProps) {
    const statusBadge = () => {
        switch (order.status) {
            case 'pending':
            case 'to_pay':
                return <Badge variant="warning">To Pay</Badge>;
            case 'to_ship':
                return <Badge variant="neutral">To Ship</Badge>;
            case 'to_receive':
                return <Badge variant="info">To Receive</Badge>;
            case 'completed':
                return <Badge variant="success">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="danger">Cancelled</Badge>;
            case 'return_refund':
                return <Badge variant="warning">Return/Refund</Badge>;
            default:
                return <Badge variant="neutral">{order.status}</Badge>;
        }
    };

    return (
        <article
            className={`bg-surface md:rounded-panel md:border md:border-border ${className}`}
        >
            {/* Header: Shop + Status */}
            <div className="flex items-center gap-2 border-b border-border px-gutter py-2 md:px-4">
                <h3 className="flex min-w-0 flex-1 items-center gap-1.5 text-label">
                    <Store
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span className="truncate">
                        {order.shop?.name ?? 'Shop'}
                    </span>
                </h3>
                {statusBadge()}
            </div>

            {/* Tracking note (for To Receive or with tracking) */}
            {(order.status === 'to_receive' || order.tracking_note) && (
                <Link
                    href={`/account/orders/${order.id}`}
                    className="flex min-h-touch items-center gap-2 border-b border-border px-gutter text-body-sm text-success transition-colors hover:bg-surface-subtle md:px-4"
                >
                    <Truck className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">
                        {order.tracking_note ?? 'Parcel is out for delivery'}
                    </span>
                    <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                </Link>
            )}

            {/* Item rows */}
            <ul className="divide-y divide-border px-gutter md:px-4">
                {order.items.map((item) => (
                    <li key={item.id} className="flex gap-3 py-3">
                        <div className="w-16 shrink-0 overflow-hidden rounded-tile">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
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
                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                            <p className="line-clamp-2 text-body">
                                <Link
                                    href={`/account/orders/${order.id}`}
                                    className="hover:underline"
                                >
                                    {item.product_name}
                                </Link>
                            </p>
                            <p className="text-body-sm text-muted-foreground">
                                {item.variation_label
                                    ? `${item.variation_label} · `
                                    : ''}
                                ×{item.qty}
                            </p>
                        </div>
                        <div className="text-right">
                            <PriceBlock price={item.unit_price} size="sm" />
                        </div>
                    </li>
                ))}
            </ul>

            {/* Total */}
            <div className="flex items-baseline justify-end gap-2 border-t border-border px-gutter py-2 text-body md:px-4">
                <span className="text-muted-foreground">Order total:</span>
                <span className="tabular text-price font-bold text-sale">
                    {formatPeso(order.total)}
                </span>
            </div>

            {/* Actions by status */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-gutter py-2 md:px-4">
                <Link href={`/account/orders/${order.id}`}>
                    <Button variant="neutral" size="sm">
                        View details
                    </Button>
                </Link>

                {order.status === 'to_receive' && (
                    <Button size="sm" onClick={() => onReceive?.(order.id)}>
                        Order received
                    </Button>
                )}

                {order.status === 'completed' && (
                    <>
                        {order.items[0] && !order.items[0].reviewed && (
                            <Link
                                href={`/account/order-items/${order.items[0].id}/reviews/create`}
                            >
                                <Button size="sm">Rate</Button>
                            </Link>
                        )}
                        {order.shop?.slug && (
                            <Link href={`/shops/${order.shop.slug}`}>
                                <Button variant="neutral" size="sm">
                                    Buy again
                                </Button>
                            </Link>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}
