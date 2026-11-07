import { Head, router } from '@inertiajs/react';
import { OrderRow } from '@/components/order-row';
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
    due?: string | null;
    urgent?: boolean;
    pay: string;
    thumbnail_icon: string;
};

type PageProps = {
    orders: { data: Order[]; total: number };
    filters: { status?: string; search?: string };
};

const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'ToShip', label: 'To Ship' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'ToReceive', label: 'To Receive' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function SellerOrdersIndex({ orders, filters }: PageProps) {
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

                {/* Status tabs */}
                <div
                    role="tablist"
                    aria-label="Filter by order status"
                    className="mb-4 flex flex-wrap gap-1 overflow-x-auto"
                >
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            role="tab"
                            type="button"
                            aria-selected={(filters.status ?? '') === tab.value}
                            onClick={() =>
                                applyFilter({
                                    status: tab.value || undefined,
                                })
                            }
                            className={`chip whitespace-nowrap ${
                                (filters.status ?? '') === tab.value
                                    ? 'chip-active'
                                    : ''
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

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
