import { Form, Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import {
    destroy as liftSuspension,
    store as suspendUser,
} from '@/routes/admin/users/suspension';
import { show as showShop } from '@/routes/shops';

type Detail = {
    id: string;
    name: string;
    email: string;
    role: string;
    suspended: boolean;
    suspended_at: string | null;
    email_verified_at: string | null;
    shop: {
        id: string;
        name: string;
        slug: string;
        status: string;
        suspended: boolean;
    } | null;
    orders_count: number;
    reports_count: number;
    created_at: string;
};

export default function AdminUserShow({ user }: { user: Detail }) {
    const manageable = user.role !== 'admin';

    return (
        <AdminLayout>
            <Head title={`User ${user.name}`} />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-h1">{user.name}</h1>
                    {user.suspended ? (
                        <Badge variant="danger">suspended</Badge>
                    ) : (
                        <Badge variant="success">active</Badge>
                    )}
                </div>

                <div className="panel grid gap-2 p-4">
                    <p className="text-body">
                        {user.email}
                        {user.email_verified_at
                            ? ' · verified'
                            : ' · unverified'}
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                        {user.role} · joined {formatDateTime(user.created_at)} ·{' '}
                        {user.orders_count} orders · {user.reports_count}{' '}
                        reports filed
                    </p>
                    {user.suspended_at && (
                        <p className="text-body-sm text-muted-foreground">
                            Suspended {formatDateTime(user.suspended_at)}
                        </p>
                    )}
                </div>

                {user.shop && (
                    <div className="panel grid gap-2 p-4">
                        <p className="text-label">Shop</p>
                        <p className="text-body-sm text-muted-foreground">
                            <a
                                href={showShop({ shop: user.shop.slug }).url}
                                className="text-primary-text underline"
                            >
                                {user.shop.name}
                            </a>{' '}
                            · {user.shop.status}
                            {user.shop.suspended && ' · shop suspended'}
                        </p>
                    </div>
                )}

                {manageable && (
                    <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                        <p className="text-body-sm text-muted-foreground">
                            {user.suspended
                                ? 'Lifting the suspension lets this user sign in again.'
                                : 'Suspending signs this user out and blocks future sign-ins.'}
                        </p>
                        {user.suspended ? (
                            <Form
                                action={liftSuspension({ user: user.id }).url}
                                method="delete"
                            >
                                <Button type="submit" variant="outline">
                                    Lift suspension
                                </Button>
                            </Form>
                        ) : (
                            <Form
                                action={suspendUser({ user: user.id }).url}
                                method="post"
                            >
                                <Button type="submit" variant="danger">
                                    Suspend user
                                </Button>
                            </Form>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
