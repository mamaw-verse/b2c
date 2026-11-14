import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { index as usersIndex, show as showUser } from '@/routes/admin/users';

type Row = {
    id: string;
    name: string;
    email: string;
    role: string;
    suspended: boolean;
    suspended_at: string | null;
    shop: { name: string; status: string } | null;
    staff_at?: { name: string; status: string } | null;
    orders_count: number;
    created_at: string;
};

export default function AdminUsers({
    users,
    filters,
}: {
    users: Row[];
    filters: {
        q: string | null;
        role: string | null;
        suspended: boolean | null;
    };
}) {
    return (
        <AdminLayout>
            <Head title="Users" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Users</h1>

                <Form
                    action={usersIndex().url}
                    method="get"
                    className="panel flex flex-wrap items-end gap-3 p-4"
                >
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="filter-q"
                            className="text-body-sm font-medium"
                        >
                            Search
                        </label>
                        <Input
                            id="filter-q"
                            name="q"
                            defaultValue={filters.q ?? ''}
                            placeholder="Name or email"
                            className="w-56"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="filter-role"
                            className="text-body-sm font-medium"
                        >
                            Role
                        </label>
                        <Select
                            id="filter-role"
                            name="role"
                            defaultValue={filters.role ?? ''}
                            className="w-36"
                        >
                            <option value="">All</option>
                            <option value="buyer">Buyer</option>
                            <option value="admin">Admin</option>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="filter-suspended"
                            className="text-body-sm font-medium"
                        >
                            Status
                        </label>
                        <Select
                            id="filter-suspended"
                            name="suspended"
                            defaultValue={
                                filters.suspended === null
                                    ? ''
                                    : filters.suspended
                                      ? '1'
                                      : '0'
                            }
                            className="w-36"
                        >
                            <option value="">All</option>
                            <option value="0">Active</option>
                            <option value="1">Suspended</option>
                        </Select>
                    </div>
                    <Button type="submit" variant="outline">
                        Filter
                    </Button>
                </Form>

                {users.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No users match these filters.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className="panel flex flex-wrap items-center justify-between gap-3 p-4"
                                data-test="user-row"
                            >
                                <div>
                                    <p className="text-label">
                                        {user.name}
                                        {user.suspended && (
                                            <Badge
                                                variant="danger"
                                                className="ml-2"
                                            >
                                                suspended
                                            </Badge>
                                        )}
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        {user.email} · {user.role}
                                        {user.shop &&
                                            ` · ${user.shop.name} (${user.shop.status})`}
                                        {user.staff_at &&
                                            ` · Staff at ${user.staff_at.name} (${user.staff_at.status})`}
                                        {` · ${user.orders_count} orders · joined ${formatDateTime(user.created_at)}`}
                                    </p>
                                </div>
                                <Link
                                    href={showUser({ user: user.id }).url}
                                    className="btn btn-ghost btn-sm"
                                >
                                    View
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminLayout>
    );
}
