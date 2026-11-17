import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDateTime } from '@/lib/format';
import { destroy as destroyAdmin } from '@/routes/admin/admins';
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
    staff_at?: {
        id: string;
        name: string;
        slug: string;
        status: string;
        suspended: boolean;
    } | null;
    staff_shops?: {
        id: string;
        name: string;
        slug: string;
        status: string;
        suspended: boolean;
    }[];
    orders_count: number;
    reports_count: number;
    created_at: string;
};

export default function AdminUserShow({ user }: { user: Detail }) {
    const { auth } = usePage().props;
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    const manageable = user.role !== 'admin';
    const canRevokeAdmin = user.role === 'admin' && user.id !== auth.user?.id;

    const handleRevokeAdmin = () => {
        setIsRevoking(true);
        router.delete(destroyAdmin({ admin: user.id }).url, {
            preserveScroll: true,
            onFinish: () => {
                setIsRevoking(false);
                setConfirmRevokeOpen(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`User ${user.name}`} />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-h1">{user.name}</h1>
                        {user.role === 'admin' && (
                            <Badge variant="neutral">Admin</Badge>
                        )}
                    </div>
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

                {(user.staff_shops?.length ?? 0) > 0 && (
                    <div className="panel grid gap-2 p-4">
                        <p className="text-label">Shop Staff</p>
                        {user.staff_shops?.map((staffShop) => (
                            <p
                                key={staffShop.id}
                                className="text-body-sm text-muted-foreground"
                            >
                                Staff at{' '}
                                <a
                                    href={
                                        showShop({ shop: staffShop.slug }).url
                                    }
                                    className="text-primary-text underline"
                                >
                                    {staffShop.name}
                                </a>{' '}
                                · {staffShop.status}
                                {staffShop.suspended && ' · shop suspended'}
                            </p>
                        ))}
                    </div>
                )}

                {canRevokeAdmin && (
                    <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                        <p className="text-body-sm text-muted-foreground">
                            Removing admin access reverts this user to a buyer
                            account.
                        </p>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => setConfirmRevokeOpen(true)}
                            data-test="remove-admin-button"
                        >
                            Remove admin access
                        </Button>

                        <ConfirmDialog
                            open={confirmRevokeOpen}
                            onOpenChange={setConfirmRevokeOpen}
                            title="Remove admin access"
                            text={`Are you sure you want to remove administrator access for ${user.name}? They will be reverted to a buyer account.`}
                            confirmLabel="Remove admin access"
                            cancelLabel="Cancel"
                            tone="danger"
                            loading={isRevoking}
                            onConfirm={handleRevokeAdmin}
                        />
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
