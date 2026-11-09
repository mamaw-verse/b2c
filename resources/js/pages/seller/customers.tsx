import { Head, Link } from '@inertiajs/react';
import { formatDateTime, formatPeso } from '@/lib/format';
import { store as storeChat } from '@/routes/seller/orders/chat';

type Customer = {
    id: string;
    name: string;
    orders_count: number;
    total_spent: number;
    last_order_at: string;
    last_order_id: string;
};

export default function SellerCustomers({
    customers,
}: {
    customers: Customer[];
}) {
    return (
        <>
            <Head title="Customers" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Customers</h1>
                {customers.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        Customers appear here after their first order.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {customers.map((customer) => (
                            <li
                                key={customer.id}
                                className="panel flex flex-wrap items-center justify-between gap-3 p-4"
                                data-test="customer-row"
                            >
                                <div>
                                    <p className="text-label">
                                        {customer.name}
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        {customer.orders_count} orders ·{' '}
                                        {formatPeso(customer.total_spent)} spent
                                        · last order{' '}
                                        {formatDateTime(customer.last_order_at)}
                                    </p>
                                </div>
                                <Link
                                    href={
                                        storeChat({
                                            order: customer.last_order_id,
                                        }).url
                                    }
                                    method="post"
                                    as="button"
                                    className="btn btn-ghost btn-sm"
                                >
                                    Chat
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
