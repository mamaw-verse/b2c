import { Head, router } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { OrderCard, type OrderData } from '@/components/order-card';
import { OrderStatusTabs } from '@/components/order-status-tabs';
import { EmptyState } from '@/components/ui/empty-state';

type PaginatedOrders = {
    data: any[];
    current_page: number;
    last_page: number;
    next_page_url?: string | null;
};

type OrdersPageProps = {
    status?: string | null;
    counts?: Record<string, number>;
    orders: PaginatedOrders;
};

export default function Orders({ status, counts, orders }: OrdersPageProps) {
    const handleStatusSelect = (tabKey: string | null) => {
        router.get('/account/orders', tabKey ? { status: tabKey } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReceive = (orderId: string) => {
        if (
            confirm(
                'Confirm that you have received this order in good condition?',
            )
        ) {
            router.put(
                `/account/orders/${orderId}/received`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const formattedOrders: OrderData[] = orders.data.map((order) => {
        const latestEvent = order.events?.[0];

        return {
            id: order.id,
            status: order.status,
            status_label: order.status,
            shop: order.shop
                ? {
                      name: order.shop.name,
                      slug: order.shop.slug,
                  }
                : null,
            tracking_note: latestEvent ? latestEvent.title : null,
            total: Number(order.total),
            created_at: order.created_at,
            items: (order.items || []).map((item: any) => ({
                id: item.id,
                product_name: item.product_name,
                variation_label: item.variation_label,
                unit_price: Number(item.unit_price),
                qty: Number(item.qty),
                subtotal: Number(item.subtotal),
                image_url: item.product?.images?.[0]?.url,
                product_slug: item.product?.slug,
                reviewed: Boolean(item.review),
            })),
        };
    });

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

                <div className="rounded-panel border border-border bg-surface">
                    <OrderStatusTabs
                        selected={status ?? null}
                        onSelect={handleStatusSelect}
                        counts={counts}
                    />

                    <div className="p-4 md:p-6">
                        {formattedOrders.length === 0 ? (
                            <EmptyState
                                icon={Package}
                                title="No orders found"
                                text="When you place orders, they will appear here with tracking updates."
                            />
                        ) : (
                            <div className="grid gap-4">
                                {formattedOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onReceive={handleReceive}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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
