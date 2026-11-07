import { Head, Link, router } from '@inertiajs/react';
import { TriangleAlert, Upload } from 'lucide-react';
import { OrderRow } from '@/components/order-row';
import { SalesChart } from '@/components/sales-chart';
import { StatCard } from '@/components/stat-card';
import { TaskGrid } from '@/components/task-card';
import { index as ordersIndex } from '@/routes/seller/orders';
import { dashboard as sellerDashboard } from '@/routes/seller';
import type { TaskCardProps } from '@/components/task-card';

type Metric = {
    label: string;
    value: string | number;
    delta?: string;
    up?: boolean;
    ic?: string;
    hint?: string;
};

type RecentOrder = {
    id: string;
    buyer: string;
    items: number;
    total: number;
    status: string;
    due?: string | null;
    urgent?: boolean;
    pay: string;
    thumbnail_icon: string;
    detail_url: string;
};

type PageProps = {
    shop: { name: string; slug: string };
    expiry_warning: {
        days_left: number;
        is_expired: boolean;
        listings_count: number;
        certifying_body: string;
        valid_until: string;
        product: string;
        product_id: string;
        edit_url: string;
    } | null;
    tasks: TaskCardProps[];
    metrics: Metric[];
    sales_chart: { data: [string, number][]; period: string };
    recent_orders: RecentOrder[];
};

export default function SellerDashboard({
    shop,
    expiry_warning,
    tasks,
    metrics,
    sales_chart,
    recent_orders,
}: PageProps) {
    const today = new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    function handlePeriodChange(period: string) {
        router.get(
            sellerDashboard(),
            { period },
            { preserveState: true, preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto max-w-container p-gutter py-8">
                <div className="grid gap-6">
                    {/* Page header */}
                    <div>
                        <h1 className="text-h1">
                            Assalamu alaikum, {shop.name}
                        </h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            {today}
                        </p>
                    </div>

                    {/* Halal expiry warning */}
                    {expiry_warning && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-panel border border-l-4 border-warning bg-warning-soft p-4"
                        >
                            <TriangleAlert
                                className="mt-0.5 size-5 shrink-0 text-warning"
                                aria-hidden="true"
                            />
                            <div className="flex-1">
                                <p className="text-label text-foreground">
                                    {expiry_warning.is_expired ? (
                                        <>
                                            Halal certificate expired —{' '}
                                            <strong>
                                                {expiry_warning.product}
                                            </strong>
                                        </>
                                    ) : (
                                        <>
                                            Halal certificate expires in{' '}
                                            <strong>
                                                {expiry_warning.days_left} day
                                                {expiry_warning.days_left !== 1
                                                    ? 's'
                                                    : ''}
                                            </strong>{' '}
                                            — {expiry_warning.product}
                                        </>
                                    )}
                                </p>
                                <p className="mt-0.5 text-body-sm text-muted-foreground">
                                    {expiry_warning.certifying_body} · valid
                                    until {expiry_warning.valid_until} ·{' '}
                                    {expiry_warning.listings_count} listing
                                    {expiry_warning.listings_count !== 1
                                        ? 's'
                                        : ''}
                                </p>
                                <Link
                                    href={expiry_warning.edit_url}
                                    className="mt-1 inline-flex items-center gap-1 text-body-sm text-warning underline hover:no-underline"
                                >
                                    <Upload
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    Renew certificate
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* To-do tasks */}
                    {tasks.length > 0 && (
                        <section aria-labelledby="tasks-heading">
                            <h2 id="tasks-heading" className="mb-3 text-h3">
                                To do
                            </h2>
                            <TaskGrid tasks={tasks} />
                        </section>
                    )}

                    {/* Sales snapshot */}
                    <section aria-labelledby="metrics-heading">
                        <h2 id="metrics-heading" className="mb-3 text-h3">
                            Sales snapshot
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {metrics.map((m) => (
                                <StatCard
                                    key={m.label}
                                    label={m.label}
                                    value={m.value}
                                    delta={m.delta}
                                    up={m.up}
                                    ic={m.ic}
                                    hint={m.hint}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Sales chart */}
                    <section className="panel p-4 md:p-6">
                        <SalesChart
                            data={sales_chart.data}
                            period={sales_chart.period}
                            onPeriodChange={handlePeriodChange}
                        />
                    </section>

                    {/* Orders to ship */}
                    {recent_orders.length > 0 && (
                        <section aria-labelledby="orders-heading">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 id="orders-heading" className="text-h3">
                                    Orders to ship
                                </h2>
                                <Link
                                    href={ordersIndex()}
                                    className="text-body-sm text-primary hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="panel divide-y divide-border overflow-hidden">
                                {recent_orders.map((order) => (
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
                                        detailUrl={order.detail_url}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
