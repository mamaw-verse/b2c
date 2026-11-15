import { Head } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { FormModal, ModalDeleteButton } from '@/components/form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
    VoucherFields,
    voucherSummary,
    type Voucher,
} from '@/components/voucher-form';
import AdminLayout from '@/layouts/admin-layout';
import {
    destroy as destroyVoucher,
    store as storeVoucher,
    update as updateVoucher,
} from '@/routes/admin/vouchers';

export default function AdminVouchers({ vouchers }: { vouchers: Voucher[] }) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Voucher | null>(null);

    return (
        <AdminLayout>
            <Head title="Platform vouchers" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Platform vouchers</h1>
                    <Button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="w-full md:w-auto"
                        data-test="new-voucher-button"
                    >
                        New voucher
                    </Button>
                </div>
                <p className="text-body-sm text-muted-foreground">
                    Platform and shipping vouchers are funded by the
                    marketplace.
                </p>

                {vouchers.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No platform vouchers yet.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {vouchers.map((voucher) => (
                            <li
                                key={voucher.id}
                                className="panel grid gap-2 p-4"
                                data-test="voucher-row"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-label font-bold text-foreground">
                                        {voucher.code}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                voucher.is_active
                                                    ? 'success'
                                                    : 'neutral'
                                            }
                                        >
                                            {voucher.is_active
                                                ? 'active'
                                                : 'inactive'}
                                        </Badge>
                                        <IconButton
                                            variant="plain"
                                            icon={
                                                <Pencil
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            }
                                            label={`Edit ${voucher.code}`}
                                            onClick={() => setEditing(voucher)}
                                            data-test="edit-voucher"
                                        />
                                    </div>
                                </div>
                                <p className="text-body-sm text-muted-foreground">
                                    {voucherSummary(voucher)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {creating && (
                <FormModal
                    title="New voucher"
                    action={storeVoucher().url}
                    method="post"
                    submitLabel="Create voucher"
                    onClose={() => setCreating(false)}
                >
                    {(errors) => <VoucherFields errors={errors} includeKind />}
                </FormModal>
            )}

            {editing && (
                <FormModal
                    key={editing.id}
                    title={`Edit ${editing.code}`}
                    action={updateVoucher({ voucher: editing.id }).url}
                    method="put"
                    submitLabel="Save changes"
                    onClose={() => setEditing(null)}
                    footerStart={
                        <ModalDeleteButton
                            url={destroyVoucher({ voucher: editing.id }).url}
                            title="Delete voucher"
                            text={`Delete ${editing.code}? This cannot be undone.`}
                            onDone={() => setEditing(null)}
                        />
                    }
                >
                    {(errors) => (
                        <VoucherFields
                            voucher={editing}
                            errors={errors}
                            includeKind
                        />
                    )}
                </FormModal>
            )}
        </AdminLayout>
    );
}
