import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatPeso } from '@/lib/format';
import { DsIcon } from '@/components/ds-icon';

export type OrderRow = {
    id: string;
    raw_id: string;
    status: string;
    status_variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    items: number;
    total: number;
    created_at: string;
    detail_url: string;
    // seller variant extras
    buyer?: string;
    pay?: string;
};

type Props = {
    orders: OrderRow[];
    variant: 'seller' | 'buyer';
    emptyText?: string;
};

export function OrdersTable({
    orders,
    variant,
    emptyText = 'No orders found.',
}: Props) {
    if (orders.length === 0) {
        return (
            <div className="card grid place-items-center p-8 text-center text-muted-foreground">
                <DsIcon name="inbox" className="mb-2 size-8" />
                <p>{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full text-body">
                <caption className="sr-only">Orders</caption>
                <thead className="border-b border-border bg-surface-subtle text-left text-label">
                    <tr>
                        <th scope="col" className="px-4 py-3">
                            Order
                        </th>
                        <th scope="col" className="px-4 py-3">
                            Date
                        </th>
                        {variant === 'seller' && (
                            <th scope="col" className="px-4 py-3">
                                Customer
                            </th>
                        )}
                        <th scope="col" className="px-4 py-3">
                            Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-end">
                            Items
                        </th>
                        <th scope="col" className="px-4 py-3 text-end">
                            Total
                        </th>
                        {variant === 'seller' && (
                            <th scope="col" className="px-4 py-3">
                                Payment
                            </th>
                        )}
                        <th scope="col" className="px-4 py-3">
                            <span className="sr-only">Action</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-subtle">
                            <td className="px-4 py-3 font-mono text-body-sm">
                                {order.id}
                            </td>
                            <td className="px-4 py-3 text-body-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                            </td>
                            {variant === 'seller' && (
                                <td className="px-4 py-3 text-body-sm">
                                    {order.buyer}
                                </td>
                            )}
                            <td className="px-4 py-3">
                                <Badge variant={order.status_variant}>
                                    {order.status}
                                </Badge>
                            </td>
                            <td className="px-4 py-3 text-end text-body-sm">
                                {order.items}
                            </td>
                            <td className="px-4 py-3 text-end text-body-sm">
                                {formatPeso(order.total)}
                            </td>
                            {variant === 'seller' && (
                                <td className="px-4 py-3 text-body-sm text-muted-foreground">
                                    {order.pay}
                                </td>
                            )}
                            <td className="px-4 py-3 text-end">
                                <Link
                                    href={order.detail_url}
                                    className="text-body-sm text-halal hover:underline"
                                >
                                    View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
