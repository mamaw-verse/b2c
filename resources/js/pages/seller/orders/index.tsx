import { Head, router } from '@inertiajs/react';
import { OrdersTable, type OrderRow } from '@/components/orders-table';
import { Input } from '@/components/ui/input';
import {
    index as ordersIndex,
    show as orderShow,
} from '@/routes/seller/orders';

type PageProps = {
    orders: { data: OrderRow[]; total: number };
    filters: { search?: string };
};

export default function SellerOrdersIndex({ orders, filters }: PageProps) {
    function applyFilter(params: Record<string, string | undefined>) {
        router.get(
            ordersIndex().url,
            { ...filters, ...params },
            { preserveState: true, replace: true },
        );
    }

    const rows: OrderRow[] = orders.data.map((order) => ({
        ...order,
        detail_url: orderShow({ order: order.raw_id }).url,
    }));

    return (
        <>
            <Head title="Orders" />
            <div className="mx-auto max-w-container p-gutter py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-h1">Orders</h1>
                    <Input
                        type="search"
                        placeholder="Search orders…"
                        defaultValue={filters.search ?? ''}
                        className="max-w-xs"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilter({
                                    search:
                                        (e.target as HTMLInputElement).value ||
                                        undefined,
                                });
                            }
                        }}
                    />
                </div>

                <OrdersTable
                    orders={rows}
                    variant="seller"
                    emptyText="No orders found. Orders placed by buyers will appear here."
                />

                <p className="mt-4 text-body-sm text-muted-foreground">
                    {orders.total} order{orders.total !== 1 ? 's' : ''} total
                </p>
            </div>
        </>
    );
}
