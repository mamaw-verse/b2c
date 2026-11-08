import { Head, router } from '@inertiajs/react';
import { OrderRow } from '@/components/order-row';
import { OrderStatusTabs } from '@/components/order-status-tabs';
import {
    index as ordersIndex,
    show as orderShow,
} from '@/routes/seller/orders';

type Order = {
    id: string;
    raw_id: string;
    buyer: string;
    items: number;
    total: number;
    status: string;
    status_variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    due?: string | null;
    urgent?: boolean;
    pay: string;
    thumbnail_icon: string;
};

type PageProps = {
    orders: { data: Order[]; total: number };
    counts: Record<string, number>;
    filters: { status?: string; search?: string };
};

export default function SellerOrdersIndex({
    orders,
    counts,
    filters,
}: PageProps) {
    function applyFilter(params: Record<string, string | undefined>) {
        router.get(
            ordersIndex().url,
            { ...filters, ...params },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Orders" />
            <div className="mx-auto max-w-container p-gutter py-8">
                <h1 className="mb-6 text-h1">Orders</h1>

                <OrderStatusTabs
                    selected={filters.status ?? null}
                    onSelect={(key) =>
                        applyFilter({ status: key ?? undefined })
                    }
                    counts={counts}
                    className="mb-4"
                />

                {orders.data.length === 0 ? (
                    <div className="card grid place-items-center p-10 text-center text-muted-foreground">
                        <p className="text-h3">No orders found</p>
                        <p className="mt-1 text-body">
                            Orders placed by buyers will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="panel divide-y divide-border overflow-hidden">
                        {orders.data.map((order) => (
                            <OrderRow
                                key={order.id}
                                id={order.id}
                                buyer={order.buyer}
                                items={order.items}
                                total={order.total}
                                status={order.status}
                                statusVariant={order.status_variant}
                                due={order.due}
                                urgent={order.urgent}
                                pay={order.pay}
                                thumbnailIcon={order.thumbnail_icon}
                                detailUrl={
                                    orderShow({ order: order.raw_id }).url
                                }
                            />
                        ))}
                    </div>
                )}

                <p className="mt-4 text-body-sm text-muted-foreground">
                    {orders.total} order{orders.total !== 1 ? 's' : ''} total
                </p>
            </div>
        </>
    );
}
