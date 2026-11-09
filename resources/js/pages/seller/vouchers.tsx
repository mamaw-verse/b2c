import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    VoucherFields,
    voucherSummary,
    type Voucher,
} from '@/components/voucher-form';
import {
    destroy as destroyVoucher,
    store as storeVoucher,
    update as updateVoucher,
} from '@/routes/seller/vouchers';

export default function SellerVouchers({ vouchers }: { vouchers: Voucher[] }) {
    return (
        <>
            <Head title="Marketing" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Marketing</h1>
                <p className="text-body-sm text-muted-foreground">
                    Shop vouchers discount orders from your shop — you fund the
                    discount.
                </p>

                <details className="panel p-4" data-test="new-voucher">
                    <summary className="cursor-pointer text-label">
                        New voucher
                    </summary>
                    <Form
                        action={storeVoucher().url}
                        method="post"
                        className="mt-3"
                    >
                        {({ errors }) => (
                            <div className="grid gap-3">
                                <VoucherFields errors={errors} />
                                <div>
                                    <Button type="submit" size="sm">
                                        Create voucher
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </details>

                {vouchers.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No vouchers yet.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {vouchers.map((voucher) => (
                            <li
                                key={voucher.id}
                                className="panel grid gap-2 p-4"
                                data-test="voucher-row"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-label">{voucher.code}</p>
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
                                </div>
                                <p className="text-body-sm text-muted-foreground">
                                    {voucherSummary(voucher)}
                                </p>
                                <details>
                                    <summary className="cursor-pointer text-body-sm font-medium text-primary-text">
                                        Edit
                                    </summary>
                                    <div className="mt-3 grid gap-3">
                                        <Form
                                            action={
                                                updateVoucher({
                                                    voucher: voucher.id,
                                                }).url
                                            }
                                            method="put"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            {({ errors }) => (
                                                <div className="grid gap-3">
                                                    <VoucherFields
                                                        voucher={voucher}
                                                        errors={errors}
                                                        fieldPrefix={`v-${voucher.id}-`}
                                                    />
                                                    <div>
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                        >
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Form>
                                        <Form
                                            action={
                                                destroyVoucher({
                                                    voucher: voucher.id,
                                                }).url
                                            }
                                            method="delete"
                                            options={{
                                                preserveScroll: true,
                                            }}
                                        >
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                Delete
                                            </Button>
                                        </Form>
                                    </div>
                                </details>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
