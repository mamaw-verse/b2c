import { Head, Link } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { KeyValueList } from '@/components/key-value-list';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import { index as customersIndex } from '@/routes/seller/customers';

type OrderRow = {
    id: string;
    raw_id: string;
    date: string;
    status: string;
    status_variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    total: number;
    url: string;
};

type CustomerDetail = {
    id: string;
    name: string;
    email: string;
    joined_date?: string | null;
    phone_numbers: string[];
    shipping_addresses: string[];
    totals: {
        orders: number;
        completed: number;
        cancelled: number;
        return_refund: number;
        total_spent: number;
    };
    orders: OrderRow[];
    chat_url?: string | null;
};

type PageProps = {
    customer: CustomerDetail;
};

export default function SellerCustomerShow({ customer }: PageProps) {
    const contactRows: [string, React.ReactNode][] = [
        ['Email', customer.email],
        [
            'Joined',
            customer.joined_date ? formatDate(customer.joined_date) : '—',
        ],
        [
            'Phone',
            customer.phone_numbers.length > 0
                ? customer.phone_numbers.join(', ')
                : 'None recorded',
        ],
    ];

    return (
        <>
            <Head title={`Customer: ${customer.name}`} />
            <div className="mx-auto max-w-container p-gutter py-8">
                {/* Breadcrumb */}
                <nav className="mb-4 flex items-center gap-1 text-body-sm text-muted-foreground">
                    <Link
                        href={customersIndex().url}
                        className="hover:text-foreground hover:underline"
                    >
                        Customers
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-foreground">{customer.name}</span>
                </nav>

                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-h1">{customer.name}</h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            {customer.email}
                        </p>
                    </div>
                    {customer.chat_url && (
                        <Link
                            href={customer.chat_url}
                            className="btn btn-secondary inline-flex items-center gap-2"
                        >
                            <MessageCircle
                                className="size-4"
                                aria-hidden="true"
                            />
                            <span>Chat with customer</span>
                        </Link>
                    )}
                </div>

                {/* Stat Tiles */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        label="Total spent"
                        value={formatPeso(customer.totals.total_spent)}
                    />
                    <StatCard label="Orders" value={customer.totals.orders} />
                    <StatCard
                        label="Completed"
                        value={customer.totals.completed}
                    />
                    <StatCard
                        label="Cancelled"
                        value={customer.totals.cancelled}
                    />
                    <StatCard
                        label="Return/Refund"
                        value={customer.totals.return_refund}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Contact & Addresses */}
                    <div className="grid gap-6 lg:col-span-1">
                        <section className="panel p-4 md:p-6">
                            <Heading title="Contact Details" variant="small" />
                            <div className="mt-3">
                                <KeyValueList rows={contactRows} />
                            </div>
                        </section>

                        <section className="panel p-4 md:p-6">
                            <Heading
                                title="Delivery Addresses"
                                description="Recorded from orders placed with your shop."
                                variant="small"
                            />
                            {customer.shipping_addresses.length === 0 ? (
                                <p className="mt-3 text-body-sm text-muted-foreground">
                                    No shipping addresses found.
                                </p>
                            ) : (
                                <ul className="mt-3 divide-y divide-border text-body-sm">
                                    {customer.shipping_addresses.map(
                                        (address, i) => (
                                            <li
                                                key={i}
                                                className="py-2 first:pt-0 last:pb-0"
                                            >
                                                {address}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </section>
                    </div>

                    {/* Orders Table */}
                    <div className="lg:col-span-2">
                        <section className="panel p-4 md:p-6">
                            <Heading
                                title="Order History"
                                description={`All orders placed by ${customer.name} in your shop.`}
                                variant="small"
                            />
                            {customer.orders.length === 0 ? (
                                <p className="mt-3 text-body text-muted-foreground">
                                    No orders found.
                                </p>
                            ) : (
                                <div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface">
                                    <table className="w-full text-body">
                                        <caption className="sr-only">
                                            Customer orders
                                        </caption>
                                        <thead className="border-b border-border bg-surface-subtle text-left text-label">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3"
                                                >
                                                    Order
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3"
                                                >
                                                    Date
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3"
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-end"
                                                >
                                                    Total
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-end"
                                                >
                                                    <span className="sr-only">
                                                        Action
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {customer.orders.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className="hover:bg-surface-subtle"
                                                >
                                                    <td className="px-4 py-3 font-mono text-body-sm">
                                                        {order.id}
                                                    </td>
                                                    <td className="px-4 py-3 text-body-sm text-muted-foreground">
                                                        {formatDateTime(
                                                            order.date,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant={
                                                                order.status_variant
                                                            }
                                                        >
                                                            {order.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-end text-body-sm">
                                                        {formatPeso(
                                                            order.total,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-end">
                                                        <Link
                                                            href={order.url}
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
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
