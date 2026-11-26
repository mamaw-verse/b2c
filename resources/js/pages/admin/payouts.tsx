import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { formatDateTime, formatPeso } from '@/lib/format';
import { update as updatePayout } from '@/routes/admin/payouts';
import { update as updateRefund } from '@/routes/admin/refunds';

type PayoutRow = {
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

type ShopBalanceRow = {
    id: string;
    name: string;
    slug: string;
    available: number;
    held: number;
    total: number;
    is_negative: boolean;
};

type CustomerRefundRow = {
    id: string;
    order_id: string;
    order_reference: string;
    buyer: {
        id: string;
        name: string;
        email: string;
    };
    amount: number;
    reason: string | null;
    resolved_by: string | null;
    created_at: string;
};

type AffiliateProfileRow = {
    id: string;
    code: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    total: number;
    pending: number;
    available: number;
};

type PayablesPageProps = {
    summary?: {
        sellers: {
            owed_to_sellers: number;
            owed_by_sellers: number;
            available: number;
            held: number;
            net_total: number;
        };
        customers: {
            total_refunds: number;
            pending_count: number;
        };
        affiliates: {
            total_accrued: number;
            profiles_count: number;
        };
    };
    sellers?: {
        shop_balances: ShopBalanceRow[];
        payout_requests: PayoutRow[];
    };
    customers?: {
        refunds: CustomerRefundRow[];
    };
    affiliates?: {
        profiles: AffiliateProfileRow[];
    };
    payouts?: PayoutRow[];
};

const payoutVariant = {
    requested: 'warning',
    paid: 'success',
    rejected: 'neutral',
} as const;

export default function AdminPayouts({
    summary = {
        sellers: {
            owed_to_sellers: 0,
            owed_by_sellers: 0,
            available: 0,
            held: 0,
            net_total: 0,
        },
        customers: {
            total_refunds: 0,
            pending_count: 0,
        },
        affiliates: {
            total_accrued: 0,
            profiles_count: 0,
        },
    },
    sellers,
    customers,
    affiliates,
    payouts: legacyPayouts,
}: PayablesPageProps) {
    const [tab, setTab] = useState<'sellers' | 'customers' | 'affiliates'>(
        'sellers',
    );

    const payoutRequests = sellers?.payout_requests ?? legacyPayouts ?? [];
    const shopBalances = sellers?.shop_balances ?? [];
    const refunds = customers?.refunds ?? [];
    const affiliateProfiles = affiliates?.profiles ?? [];

    const requestedPayoutsCount = payoutRequests.filter(
        (p) => p.status === 'requested',
    ).length;

    return (
        <AdminLayout>
            <Head title="Payables & Payouts" />
            <div className="mx-auto grid max-w-container gap-6 p-gutter py-8">
                <header>
                    <h1 className="text-h1">Payables & Payouts</h1>
                    <p className="mt-1 text-body text-muted-foreground">
                        Manage seller payouts, customer refunds, and view
                        platform obligations.
                    </p>
                </header>

                {/* 3 Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Sellers Card */}
                    <div className="panel grid gap-2 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-label text-muted-foreground">
                                Sellers Payable
                            </span>
                            {summary.sellers.owed_by_sellers > 0 && (
                                <Badge variant="danger">Negative balance</Badge>
                            )}
                        </div>
                        <p className="text-h2 font-semibold">
                            {formatPeso(summary.sellers.owed_to_sellers)}
                        </p>
                        <div className="text-body-sm text-muted-foreground">
                            <span>
                                Available:{' '}
                                {formatPeso(summary.sellers.available)}
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>
                                Held: {formatPeso(summary.sellers.held)}
                            </span>
                        </div>
                        {summary.sellers.owed_by_sellers > 0 && (
                            <p className="text-body-sm text-danger-text">
                                Owed by sellers:{' '}
                                {formatPeso(summary.sellers.owed_by_sellers)}
                            </p>
                        )}
                    </div>

                    {/* Customers Card */}
                    <div className="panel grid gap-2 p-4">
                        <span className="text-label text-muted-foreground">
                            Customer Refunds
                        </span>
                        <p className="text-h2 font-semibold">
                            {formatPeso(summary.customers.total_refunds)}
                        </p>
                        <p className="text-body-sm text-muted-foreground">
                            {summary.customers.pending_count} pending refund
                            {summary.customers.pending_count === 1 ? '' : 's'}
                        </p>
                    </div>

                    {/* Affiliates Card */}
                    <div className="panel grid gap-2 p-4 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-label text-muted-foreground">
                                Affiliate Accruals
                            </span>
                            <Badge variant="neutral">Parked</Badge>
                        </div>
                        <p className="text-h2 font-semibold">
                            {formatPeso(summary.affiliates.total_accrued)}
                        </p>
                        <p className="text-body-sm text-muted-foreground">
                            {summary.affiliates.profiles_count} profile
                            {summary.affiliates.profiles_count === 1
                                ? ''
                                : 's'}{' '}
                            with accrued earnings
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        type="button"
                        onClick={() => setTab('sellers')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-label transition-colors ${
                            tab === 'sellers'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Sellers
                        {requestedPayoutsCount > 0 && (
                            <Badge variant="warning">
                                {requestedPayoutsCount}
                            </Badge>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('customers')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-label transition-colors ${
                            tab === 'customers'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Customer Refunds
                        {summary.customers.pending_count > 0 && (
                            <Badge variant="warning">
                                {summary.customers.pending_count}
                            </Badge>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('affiliates')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-label transition-colors ${
                            tab === 'affiliates'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Affiliates (Read-only)
                    </button>
                </div>

                {/* Tab 1: Sellers */}
                {tab === 'sellers' && (
                    <div className="grid gap-8">
                        {/* Payout requests subsection */}
                        <section className="grid gap-3">
                            <h2 className="text-h3">Payout Requests</h2>
                            {payoutRequests.length === 0 ? (
                                <p className="text-body text-muted-foreground">
                                    No payout requests.
                                </p>
                            ) : (
                                <ul className="grid gap-3">
                                    {payoutRequests.map((payout) => (
                                        <PayoutRequestItem
                                            key={payout.id}
                                            payout={payout}
                                        />
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Shop balances subsection */}
                        <section className="grid gap-3">
                            <h2 className="text-h3">Shop Balances</h2>
                            {shopBalances.length === 0 ? (
                                <p className="text-body text-muted-foreground">
                                    No shop balances recorded.
                                </p>
                            ) : (
                                <>
                                    {/* Desktop Table (lg) */}
                                    <div className="hidden overflow-x-auto rounded-panel border border-border bg-surface lg:block">
                                        <table className="w-full text-body">
                                            <thead className="border-b border-border bg-surface-subtle text-left text-label">
                                                <tr>
                                                    <th className="px-4 py-3">
                                                        Shop
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Available
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Held
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Total Balance
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {shopBalances.map((sb) => (
                                                    <tr key={sb.id}>
                                                        <td className="px-4 py-3 font-medium">
                                                            {sb.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {formatPeso(
                                                                sb.available,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {formatPeso(
                                                                sb.held,
                                                            )}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-right font-medium ${
                                                                sb.is_negative
                                                                    ? 'text-danger-text'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {formatPeso(
                                                                sb.total,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {sb.is_negative ? (
                                                                <Badge variant="danger">
                                                                    Owed by
                                                                    seller
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="success">
                                                                    Active
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile/Tablet Cards (sm/md) */}
                                    <div className="grid gap-3 lg:hidden">
                                        {shopBalances.map((sb) => (
                                            <div
                                                key={sb.id}
                                                className="panel grid gap-2 p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">
                                                        {sb.name}
                                                    </span>
                                                    {sb.is_negative ? (
                                                        <Badge variant="danger">
                                                            Owed by seller
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="success">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-body-sm text-muted-foreground">
                                                    <div>
                                                        Available:{' '}
                                                        {formatPeso(
                                                            sb.available,
                                                        )}
                                                    </div>
                                                    <div>
                                                        Held:{' '}
                                                        {formatPeso(sb.held)}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between border-t border-border pt-2 text-body-sm font-semibold">
                                                    <span>Total Balance:</span>
                                                    <span
                                                        className={
                                                            sb.is_negative
                                                                ? 'text-danger-text'
                                                                : ''
                                                        }
                                                    >
                                                        {formatPeso(sb.total)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                )}

                {/* Tab 2: Customers */}
                {tab === 'customers' && (
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-h3">Pending Refunds</h2>
                            <span className="text-body-sm text-muted-foreground">
                                Total pending:{' '}
                                {formatPeso(summary.customers.total_refunds)}
                            </span>
                        </div>

                        {refunds.length === 0 ? (
                            <p className="text-body text-muted-foreground">
                                No pending customer refunds.
                            </p>
                        ) : (
                            <>
                                {/* Desktop Table (lg) */}
                                <div className="hidden overflow-x-auto rounded-panel border border-border bg-surface lg:block">
                                    <table className="w-full text-body">
                                        <thead className="border-b border-border bg-surface-subtle text-left text-label">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Order
                                                </th>
                                                <th className="px-4 py-3">
                                                    Buyer
                                                </th>
                                                <th className="px-4 py-3">
                                                    Reason
                                                </th>
                                                <th className="px-4 py-3">
                                                    Approved by
                                                </th>
                                                <th className="px-4 py-3">
                                                    Approved Date
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {refunds.map((refund) => (
                                                <tr key={refund.id}>
                                                    <td className="px-4 py-3 font-medium">
                                                        {refund.order_reference}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            {refund.buyer.name}
                                                        </div>
                                                        <div className="text-body-sm text-muted-foreground">
                                                            {refund.buyer.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {refund.reason || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {refund.resolved_by ||
                                                            '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDateTime(
                                                            refund.created_at,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {formatPeso(
                                                            refund.amount,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Form
                                                            action={
                                                                updateRefund({
                                                                    refund: refund.id,
                                                                }).url
                                                            }
                                                            method="put"
                                                            className="flex items-center justify-end gap-2"
                                                        >
                                                            {({ errors }) => (
                                                                <>
                                                                    <Input
                                                                        name="reference"
                                                                        placeholder="Refund reference"
                                                                        aria-label="Refund reference"
                                                                        className="w-40"
                                                                        aria-invalid={
                                                                            errors.reference
                                                                                ? true
                                                                                : undefined
                                                                        }
                                                                    />
                                                                    <Button type="submit">
                                                                        Mark
                                                                        refunded
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </Form>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile/Tablet Cards (sm/md) */}
                                <div className="grid gap-3 lg:hidden">
                                    {refunds.map((refund) => (
                                        <div
                                            key={refund.id}
                                            className="panel grid gap-3 p-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-semibold">
                                                    Order{' '}
                                                    {refund.order_reference}
                                                </span>
                                                <span className="text-label font-bold">
                                                    {formatPeso(refund.amount)}
                                                </span>
                                            </div>
                                            <p className="text-body-sm text-muted-foreground">
                                                Buyer: {refund.buyer.name} (
                                                {refund.buyer.email})
                                            </p>
                                            {refund.reason && (
                                                <p className="text-body-sm text-muted-foreground">
                                                    Reason: {refund.reason}
                                                </p>
                                            )}
                                            <p className="text-body-sm text-muted-foreground">
                                                Approved:{' '}
                                                {formatDateTime(
                                                    refund.created_at,
                                                )}
                                                {refund.resolved_by &&
                                                    ` by ${refund.resolved_by}`}
                                            </p>
                                            <Form
                                                action={
                                                    updateRefund({
                                                        refund: refund.id,
                                                    }).url
                                                }
                                                method="put"
                                                className="flex flex-col gap-2 pt-2 sm:flex-row"
                                            >
                                                {({ errors }) => (
                                                    <>
                                                        <Input
                                                            name="reference"
                                                            placeholder="Refund reference"
                                                            aria-label="Refund reference"
                                                            aria-invalid={
                                                                errors.reference
                                                                    ? true
                                                                    : undefined
                                                            }
                                                        />
                                                        <Button
                                                            type="submit"
                                                            className="w-full sm:w-auto"
                                                        >
                                                            Mark refunded
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Tab 3: Affiliates */}
                {tab === 'affiliates' && (
                    <div className="grid gap-4">
                        <div className="rounded-panel border border-info bg-info-soft p-3 text-body-sm text-info-text">
                            Affiliate program payouts are currently parked. The
                            figures below reflect accrued earnings net of return
                            reversals.
                        </div>

                        {affiliateProfiles.length === 0 ? (
                            <p className="text-body text-muted-foreground">
                                No accrued affiliate earnings.
                            </p>
                        ) : (
                            <>
                                {/* Desktop Table (lg) */}
                                <div className="hidden overflow-x-auto rounded-panel border border-border bg-surface lg:block">
                                    <table className="w-full text-body">
                                        <thead className="border-b border-border bg-surface-subtle text-left text-label">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Code
                                                </th>
                                                <th className="px-4 py-3">
                                                    Affiliate User
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Pending
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Available
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Total Accrued
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {affiliateProfiles.map(
                                                (profile) => (
                                                    <tr key={profile.id}>
                                                        <td className="px-4 py-3 font-mono font-medium">
                                                            {profile.code}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                {
                                                                    profile.user
                                                                        .name
                                                                }
                                                            </div>
                                                            <div className="text-body-sm text-muted-foreground">
                                                                {
                                                                    profile.user
                                                                        .email
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {formatPeso(
                                                                profile.pending,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {formatPeso(
                                                                profile.available,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold">
                                                            {formatPeso(
                                                                profile.total,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile/Tablet Cards (sm/md) */}
                                <div className="grid gap-3 lg:hidden">
                                    {affiliateProfiles.map((profile) => (
                                        <div
                                            key={profile.id}
                                            className="panel grid gap-2 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-semibold">
                                                    {profile.code}
                                                </span>
                                                <span className="font-bold">
                                                    {formatPeso(profile.total)}
                                                </span>
                                            </div>
                                            <p className="text-body-sm text-muted-foreground">
                                                {profile.user.name} (
                                                {profile.user.email})
                                            </p>
                                            <div className="flex justify-between border-t border-border pt-2 text-body-sm text-muted-foreground">
                                                <span>
                                                    Pending:{' '}
                                                    {formatPeso(
                                                        profile.pending,
                                                    )}
                                                </span>
                                                <span>
                                                    Available:{' '}
                                                    {formatPeso(
                                                        profile.available,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function PayoutRequestItem({ payout }: { payout: PayoutRow }) {
    const [reference, setReference] = useState(payout.reference ?? '');
    const [confirming, setConfirming] = useState<'paid' | 'rejected' | null>(
        null,
    );
    const [processing, setProcessing] = useState(false);
    const [invalidReference, setInvalidReference] = useState(false);

    const resolve = () => {
        if (!confirming) {
            return;
        }

        setProcessing(true);
        router.put(
            updatePayout({ payout: payout.id }).url,
            {
                status: confirming,
                ...(confirming === 'paid' ? { reference } : {}),
            },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setInvalidReference(Boolean(errors.reference)),
                onFinish: () => {
                    setProcessing(false);
                    setConfirming(null);
                },
            },
        );
    };

    return (
        <li className="panel grid gap-3 p-4" data-test="payout-request">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-label">
                    {payout.shop} · {formatPeso(payout.amount)}
                </p>
                <Badge variant={payoutVariant[payout.status]}>
                    {payout.status}
                </Badge>
            </div>
            <p className="text-body-sm text-muted-foreground">
                {payout.method} · {payout.account_name} ·{' '}
                {payout.account_number} · {formatDateTime(payout.created_at)}
                {payout.reference && ` · ${payout.reference}`}
            </p>
            {payout.status === 'requested' && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Input
                            name="reference"
                            placeholder="Transfer reference"
                            aria-label="Transfer reference"
                            value={reference}
                            onChange={(e) => {
                                setReference(e.target.value);
                                setInvalidReference(false);
                            }}
                            aria-invalid={invalidReference || undefined}
                        />
                        <Button
                            type="button"
                            className="shrink-0 whitespace-nowrap"
                            onClick={() => setConfirming('paid')}
                        >
                            Mark paid
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="ml-auto shrink-0"
                        onClick={() => setConfirming('rejected')}
                    >
                        Reject
                    </Button>
                </div>
            )}
            <ConfirmDialog
                open={confirming !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirming(null);
                    }
                }}
                title={
                    confirming === 'paid'
                        ? 'Mark payout as paid'
                        : 'Reject payout'
                }
                text={
                    confirming === 'paid'
                        ? `Confirm the ${formatPeso(payout.amount)} payout to ${payout.shop} was sent${reference ? ` (ref: ${reference})` : ''}?`
                        : `Reject the ${formatPeso(payout.amount)} payout to ${payout.shop}? The amount will be returned to the shop's available balance.`
                }
                confirmLabel={confirming === 'paid' ? 'Mark paid' : 'Reject'}
                cancelLabel="Cancel"
                tone={confirming === 'rejected' ? 'danger' : 'primary'}
                loading={processing}
                onConfirm={resolve}
            />
        </li>
    );
}
