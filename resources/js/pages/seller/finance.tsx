import { Form, Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatPeso } from '@/lib/format';
import { index as financeIndex } from '@/routes/seller/finance';
import { update as updateAccount } from '@/routes/seller/payout-account';
import { store as requestPayout } from '@/routes/seller/payouts';

type Entry = {
    id: string;
    type: string;
    label: string;
    amount: number;
    order: string | null;
    available_at: string;
    is_available: boolean;
    created_at: string;
};

type PayoutRow = {
    id: string;
    amount: number;
    status: 'requested' | 'paid' | 'rejected';
    reference: string | null;
    created_at: string;
};

type Props = {
    balance: { pending: number; available: number; paid: number };
    minimum_payout: number;
    hold_days: number;
    payout_account: {
        method: string | null;
        name: string | null;
        number_hint: string | null;
    };
    entries: Entry[];
    payouts: PayoutRow[];
};

const types = [
    ['', 'All'],
    ['sale', 'Sales'],
    ['commission', 'Commission'],
    ['platform_voucher_reimbursement', 'Reimbursements'],
    ['payout', 'Payouts'],
    ['adjustment', 'Adjustments'],
] as const;

const payoutVariant = {
    requested: 'warning',
    paid: 'success',
    rejected: 'neutral',
} as const;

export default function SellerFinance({
    balance,
    minimum_payout,
    hold_days,
    payout_account,
    entries,
    payouts,
}: Props) {
    const hasAccount = payout_account.method !== null;

    return (
        <>
            <Head title="Finance" />
            <div className="mx-auto grid max-w-container gap-6 p-gutter py-8">
                <h1 className="text-h1">Finance</h1>

                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        ['Available', balance.available, 'balance-available'],
                        ['Pending', balance.pending, 'balance-pending'],
                        ['Paid out', balance.paid, 'balance-paid'],
                    ].map(([label, value, test]) => (
                        <div key={label} className="panel p-4">
                            <p className="text-body-sm text-muted-foreground">
                                {label}
                            </p>
                            <p className="text-h2" data-test={test}>
                                {formatPeso(value as number)}
                            </p>
                        </div>
                    ))}
                </div>
                <p className="text-body-sm text-muted-foreground">
                    Completed orders become available {hold_days} days after
                    completion.
                </p>

                <section className="panel grid gap-6 p-4 md:grid-cols-2 md:p-6">
                    <div>
                        <h2 className="mb-3 text-h3">Payout account</h2>
                        {hasAccount && (
                            <p className="mb-3 text-body-sm text-muted-foreground">
                                {payout_account.method} · {payout_account.name}{' '}
                                · {payout_account.number_hint}
                            </p>
                        )}
                        <Form action={updateAccount().url} method="put">
                            {({ processing, errors }) => (
                                <div className="grid gap-3">
                                    <FormField
                                        label="Method (bank or e-wallet)"
                                        required
                                        error={errors.payout_method}
                                    >
                                        <Input
                                            name="payout_method"
                                            placeholder="e.g. GCash"
                                            defaultValue={
                                                payout_account.method ?? ''
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Account name"
                                        required
                                        error={errors.payout_account_name}
                                    >
                                        <Input
                                            name="payout_account_name"
                                            defaultValue={
                                                payout_account.name ?? ''
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Account number"
                                        required
                                        error={errors.payout_account_number}
                                    >
                                        <Input name="payout_account_number" />
                                    </FormField>
                                    <Button type="submit" disabled={processing}>
                                        Save account
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </div>
                    <div>
                        <h2 className="mb-3 text-h3">Request payout</h2>
                        <Form
                            action={requestPayout().url}
                            method="post"
                            transform={(data) => ({
                                amount: Math.round(Number(data.pesos) * 100),
                            })}
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-3">
                                    <FormField
                                        label={`Amount in pesos (minimum ${formatPeso(minimum_payout)})`}
                                        required
                                        error={
                                            errors.amount ??
                                            errors.payout_account
                                        }
                                    >
                                        <Input
                                            name="pesos"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                        />
                                    </FormField>
                                    <Button type="submit" disabled={processing}>
                                        Request payout
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </div>
                </section>

                <section className="panel p-4 md:p-6">
                    <h2 className="mb-3 text-h3">Payout history</h2>
                    {payouts.length === 0 ? (
                        <p className="text-body text-muted-foreground">
                            No payouts yet.
                        </p>
                    ) : (
                        <ul className="grid gap-2">
                            {payouts.map((payout) => (
                                <li
                                    key={payout.id}
                                    className="flex flex-wrap items-center justify-between gap-2"
                                    data-test="payout-row"
                                >
                                    <span>
                                        {formatPeso(payout.amount)} ·{' '}
                                        {formatDateTime(payout.created_at)}
                                        {payout.reference &&
                                            ` · ${payout.reference}`}
                                    </span>
                                    <Badge
                                        variant={payoutVariant[payout.status]}
                                    >
                                        {payout.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="panel p-4 md:p-6">
                    <h2 className="mb-3 text-h3">Ledger</h2>
                    <nav className="mb-3 flex flex-wrap gap-2">
                        {types.map(([value, label]) => (
                            <Link
                                key={label}
                                href={
                                    financeIndex({
                                        query: value ? { type: value } : {},
                                    }).url
                                }
                                className="btn btn-ghost btn-sm"
                                preserveScroll
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                    {entries.length === 0 ? (
                        <p className="text-body text-muted-foreground">
                            No ledger entries yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {entries.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="flex items-center justify-between gap-2 py-2"
                                    data-test="ledger-row"
                                >
                                    <div>
                                        <p className="text-label">
                                            {entry.label}
                                            {entry.order && ` · ${entry.order}`}
                                        </p>
                                        <p className="text-body-sm text-muted-foreground">
                                            {formatDateTime(entry.created_at)}
                                            {!entry.is_available &&
                                                ` · available ${formatDateTime(entry.available_at)}`}
                                        </p>
                                    </div>
                                    <span
                                        className={
                                            entry.amount < 0
                                                ? 'text-danger-text'
                                                : ''
                                        }
                                    >
                                        {formatPeso(entry.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
