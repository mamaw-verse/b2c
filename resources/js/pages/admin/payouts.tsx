import { Form, Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatPeso } from '@/lib/format';
import { update as updatePayout } from '@/routes/admin/payouts';

type Row = {
    id: string;
    shop: string;
    amount: number;
    status: 'requested' | 'paid' | 'rejected';
    method: string;
    account_name: string;
    account_number: string;
    reference: string | null;
    created_at: string;
};

const variant = {
    requested: 'warning',
    paid: 'success',
    rejected: 'neutral',
} as const;

export default function AdminPayouts({ payouts }: { payouts: Row[] }) {
    return (
        <AdminLayout>
            <Head title="Payouts" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Payouts</h1>
                {payouts.length === 0 && (
                    <p className="text-body text-muted-foreground">
                        No payout requests.
                    </p>
                )}
                <ul className="grid gap-3">
                    {payouts.map((payout) => (
                        <li
                            key={payout.id}
                            className="panel grid gap-3 p-4"
                            data-test="payout-request"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-label">
                                    {payout.shop} · {formatPeso(payout.amount)}
                                </p>
                                <Badge variant={variant[payout.status]}>
                                    {payout.status}
                                </Badge>
                            </div>
                            <p className="text-body-sm text-muted-foreground">
                                {payout.method} · {payout.account_name} ·{' '}
                                {payout.account_number} ·{' '}
                                {formatDateTime(payout.created_at)}
                                {payout.reference && ` · ${payout.reference}`}
                            </p>
                            {payout.status === 'requested' && (
                                <div className="flex flex-wrap gap-2">
                                    <Form
                                        action={
                                            updatePayout({ payout: payout.id })
                                                .url
                                        }
                                        method="put"
                                        className="flex flex-wrap gap-2"
                                    >
                                        {({ errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="status"
                                                    value="paid"
                                                />
                                                <Input
                                                    name="reference"
                                                    placeholder="Transfer reference"
                                                    aria-label="Transfer reference"
                                                    aria-invalid={
                                                        errors.reference
                                                            ? true
                                                            : undefined
                                                    }
                                                />
                                                <Button type="submit">
                                                    Mark paid
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                    <Form
                                        action={
                                            updatePayout({ payout: payout.id })
                                                .url
                                        }
                                        method="put"
                                    >
                                        <input
                                            type="hidden"
                                            name="status"
                                            value="rejected"
                                        />
                                        <Button type="submit" variant="outline">
                                            Reject
                                        </Button>
                                    </Form>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </AdminLayout>
    );
}
