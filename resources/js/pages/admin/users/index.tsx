import { Form, Head, Link, useForm } from '@inertiajs/react';
import { type FormEvent, useRef, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { store as storeAdmin } from '@/routes/admin/admins';
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
    const [open, setOpen] = useState(false);
    const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm({
        name: '',
        email: '',
        confirm_promote: false,
    });

    const handleOpenDialog = () => {
        reset();
        clearErrors();
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
        reset();
        clearErrors();
        triggerButtonRef.current?.focus();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((values) => ({
            ...values,
            confirm_promote: false,
        }));
        post(storeAdmin().url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                triggerButtonRef.current?.focus();
            },
        });
    };

    const handleConfirmPromote = () => {
        transform((values) => ({
            ...values,
            confirm_promote: true,
        }));
        post(storeAdmin().url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                triggerButtonRef.current?.focus();
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Users" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Users</h1>
                    <Button
                        type="button"
                        onClick={handleOpenDialog}
                        ref={triggerButtonRef}
                        className="w-full md:w-auto"
                        data-test="add-admin-button"
                    >
                        Add admin
                    </Button>
                </div>

                <Dialog
                    open={open}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            handleCloseDialog();
                        } else {
                            setOpen(true);
                        }
                    }}
                >
                    <DialogContent className="w-full max-w-none sm:w-full sm:max-w-none md:m-auto md:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add admin</DialogTitle>
                            <DialogDescription>
                                {errors.confirm_promote
                                    ? 'Confirm granting administrator access.'
                                    : 'Invite a new administrator or grant admin privileges to an existing user.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-5 py-4">
                            {errors.confirm_promote ? (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className="grid gap-4"
                                >
                                    <p
                                        className="text-body font-medium"
                                        data-test="confirm-promote-message"
                                    >
                                        {errors.confirm_promote}
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        This user will be granted administrator
                                        privileges to manage the marketplace.
                                    </p>
                                    <DialogFooter className="px-0 pb-0">
                                        <Button
                                            type="button"
                                            variant="neutral"
                                            onClick={() => {
                                                clearErrors('confirm_promote');
                                                setData(
                                                    'confirm_promote',
                                                    false,
                                                );
                                            }}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            loading={processing}
                                            onClick={handleConfirmPromote}
                                            data-test="confirm-promote-button"
                                        >
                                            Make admin
                                        </Button>
                                    </DialogFooter>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    className="grid gap-4"
                                >
                                    <div role="alert" aria-live="polite">
                                        {errors.email && (
                                            <p className="sr-only">
                                                {errors.email}
                                            </p>
                                        )}
                                        {errors.name && (
                                            <p className="sr-only">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <FormField
                                        id="admin-name"
                                        label="Name"
                                        error={errors.name}
                                        help="Required when the email is not yet registered."
                                    >
                                        <Input
                                            id="admin-name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Full name"
                                            autoComplete="name"
                                            data-test="admin-name-input"
                                        />
                                    </FormField>

                                    <FormField
                                        id="admin-email"
                                        label="Email"
                                        required
                                        error={errors.email}
                                    >
                                        <Input
                                            id="admin-email"
                                            name="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            placeholder="admin@example.com"
                                            autoComplete="email"
                                            data-test="admin-email-input"
                                        />
                                    </FormField>

                                    <DialogFooter className="px-0 pb-0">
                                        <Button
                                            type="button"
                                            variant="neutral"
                                            onClick={handleCloseDialog}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={processing}
                                            data-test="submit-admin-button"
                                        >
                                            Add admin
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

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
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-2 text-label">
                                        <span className="truncate">
                                            {user.name}
                                        </span>
                                        {user.role === 'admin' && (
                                            <Badge variant="neutral">
                                                Admin
                                            </Badge>
                                        )}
                                        {user.suspended && (
                                            <Badge variant="danger">
                                                suspended
                                            </Badge>
                                        )}
                                    </p>
                                    <p className="text-body-sm break-words text-muted-foreground">
                                        {user.email} · {user.role}
                                        {user.shop &&
                                            ` · ${user.shop.name} (${user.shop.status})`}
                                        {user.staff_at &&
                                            ` · Staff at ${user.staff_at.name} (${user.staff_at.status})`}
                                        {` · ${user.orders_count} orders · joined ${formatDateTime(user.created_at)}`}
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <Link
                                        href={showUser({ user: user.id }).url}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        View
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminLayout>
    );
}
