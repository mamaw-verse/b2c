import { Head } from '@inertiajs/react';
import { OrdersTable, type OrderRow } from '@/components/orders-table';
import { show as orderShow } from '@/routes/orders';

type Order = {
    id: string;
    status_label: string;
    status_badge_variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    total: number;
    created_at: string;
    items?: { qty: number }[];
};

type OrdersPageProps = {
    orders: {
        data: Order[];
        current_page: number;
        last_page: number;
    };
};

export default function Orders({ orders }: OrdersPageProps) {
    const rows: OrderRow[] = orders.data.map((order) => ({
        id: order.id,
        raw_id: order.id,
        status: order.status_label,
        status_variant: order.status_badge_variant,
        items: (order.items ?? []).reduce(
            (sum, item) => sum + (item.qty || 0),
            0,
        ),
        total: Number(order.total),
        created_at: order.created_at,
        detail_url: orderShow({ order: order.id }).url,
    }));

    return (
        <>
            <Head title="My Purchases" />

            <div className="grid gap-4 md:gap-6">
                <header>
                    <h1 className="text-h1">My Purchases</h1>
                    <p className="mt-0.5 text-body text-muted-foreground">
                        Track, review and manage your marketplace orders.
                    </p>
                </header>

                <OrdersTable
                    orders={rows}
                    variant="buyer"
                    emptyText="When you place orders, they will appear here with tracking updates."
                />
            </div>
        </>
    );
}

Orders.layout = {
    breadcrumbs: [
        {
            title: 'My Purchases',
            href: '/account/orders',
        },
    ],
};
