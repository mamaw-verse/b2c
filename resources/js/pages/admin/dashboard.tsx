import { Head, Link } from '@inertiajs/react';
import {
    Clock,
    FileBadge,
    Flag,
    Inbox,
    ShieldAlert,
    TriangleAlert,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { StatCard } from '@/components/stat-card';

type DashboardCounts = Record<string, Record<string, number>>;

export default function AdminDashboard({
    counts = {},
    expiringCertificatesCount = 0,
}: {
    counts?: DashboardCounts;
    expiringCertificatesCount?: number;
}) {
    // Calculate totals
    const pendingTotal = Object.values(counts.pending ?? {}).reduce(
        (sum, n) => sum + n,
        0,
    );
    const flaggedTotal = Object.values(counts.flagged ?? {}).reduce(
        (sum, n) => sum + n,
        0,
    );
    const hiddenTotal = Object.values(counts.hidden ?? {}).reduce(
        (sum, n) => sum + n,
        0,
    );
    const resolvedTotal = Object.values(counts.resolved ?? {}).reduce(
        (sum, n) => sum + n,
        0,
    );

    const halalPending =
        (counts.pending?.halal ?? 0) + (counts.flagged?.halal ?? 0);
    const reportsPending =
        (counts.pending?.report ?? 0) + (counts.flagged?.report ?? 0);
    const keywordsPending =
        (counts.pending?.keyword ?? 0) + (counts.flagged?.keyword ?? 0);

    return (
        <AdminLayout pendingQueueCount={pendingTotal + flaggedTotal}>
            <Head title="Admin Dashboard" />

            <div className="mx-auto max-w-container p-gutter py-6 md:p-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-h1">Moderation Dashboard</h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            Real-time overview of the moderation queue, reports,
                            and halal compliance.
                        </p>
                    </div>

                    <Link href="/admin/moderation" className="btn btn-primary">
                        <Inbox aria-hidden="true" className="icon" />
                        <span>Go to Queue ({pendingTotal + flaggedTotal})</span>
                    </Link>
                </div>

                {/* Expiring certificate warning banner if any */}
                {expiringCertificatesCount > 0 && (
                    <div className="mb-6 flex items-start gap-3 rounded-panel border border-warning bg-warning-soft p-4 text-foreground">
                        <TriangleAlert
                            className="mt-0.5 size-5 shrink-0 text-warning"
                            aria-hidden="true"
                        />
                        <div className="flex-1">
                            <h2 className="text-label font-bold text-foreground">
                                Halal Certificate Action Required
                            </h2>
                            <p className="mt-0.5 text-body-sm text-foreground">
                                {expiringCertificatesCount}{' '}
                                {expiringCertificatesCount === 1
                                    ? 'certificate has expired or is expiring'
                                    : 'certificates have expired or are expiring'}{' '}
                                soon. Listings may be automatically hidden upon
                                expiration.
                            </p>
                        </div>
                        <Link
                            href="/admin/moderation?type=expiry"
                            className="btn btn-neutral btn-sm shrink-0"
                        >
                            <span>Review certificates</span>
                        </Link>
                    </div>
                )}

                {/* Primary Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Pending Review"
                        value={pendingTotal}
                        ic="clock"
                        hint="Awaiting moderator action"
                    />
                    <StatCard
                        label="Flagged Items"
                        value={flaggedTotal}
                        ic="flag"
                        hint="Automated & user flags"
                    />
                    <div className="card grid gap-1 border-warning/40 bg-warning-soft/30 p-4">
                        <p className="flex items-center gap-2 text-body-sm text-foreground">
                            <FileBadge className="size-4 text-warning" />
                            Expiring Certificates
                        </p>
                        <p className="tabular text-h2 text-foreground">
                            {expiringCertificatesCount}
                        </p>
                        <p className="text-caption text-muted-foreground">
                            ≤ 30 days or expired
                        </p>
                    </div>
                    <StatCard
                        label="Resolved"
                        value={resolvedTotal}
                        ic="check-circle"
                        hint="Decisions applied"
                    />
                </div>

                {/* Secondary breakdown grid */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Queue categories panel */}
                    <div className="panel p-5">
                        <h2 className="mb-4 text-h3">Queue by Category</h2>
                        <ul className="divide-y divide-border text-body">
                            <li className="flex items-center justify-between py-3">
                                <span className="flex items-center gap-2">
                                    <FileBadge
                                        aria-hidden="true"
                                        className="size-4 text-primary"
                                    />
                                    Halal Verifications
                                </span>
                                <Link
                                    href="/admin/moderation?type=halal"
                                    className="font-bold text-primary hover:underline"
                                >
                                    {halalPending} pending
                                </Link>
                            </li>
                            <li className="flex items-center justify-between py-3">
                                <span className="flex items-center gap-2">
                                    <Flag
                                        aria-hidden="true"
                                        className="size-4 text-warning"
                                    />
                                    User & Shop Reports
                                </span>
                                <Link
                                    href="/admin/moderation?type=report"
                                    className="font-bold text-primary hover:underline"
                                >
                                    {reportsPending} pending
                                </Link>
                            </li>
                            <li className="flex items-center justify-between py-3">
                                <span className="flex items-center gap-2">
                                    <ShieldAlert
                                        aria-hidden="true"
                                        className="size-4 text-danger"
                                    />
                                    Keyword Auto-Flags
                                </span>
                                <Link
                                    href="/admin/moderation?type=keyword"
                                    className="font-bold text-primary hover:underline"
                                >
                                    {keywordsPending} pending
                                </Link>
                            </li>
                            <li className="flex items-center justify-between py-3">
                                <span className="flex items-center gap-2">
                                    <Clock
                                        aria-hidden="true"
                                        className="size-4 text-muted-foreground"
                                    />
                                    General & Other
                                </span>
                                <Link
                                    href="/admin/moderation?type=general"
                                    className="font-bold text-primary hover:underline"
                                >
                                    {(counts.pending?.general ?? 0) +
                                        (counts.flagged?.general ?? 0)}{' '}
                                    pending
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick navigation / operations panel */}
                    <div className="panel p-5">
                        <h2 className="mb-4 text-h3">Moderation Workflow</h2>
                        <div className="grid gap-3">
                            <Link
                                href="/admin/moderation?state=pending"
                                className="flex items-center justify-between rounded-tile border border-border p-3 transition-colors hover:bg-surface-muted"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Open SLA Queue
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        Prioritized by response SLA deadline
                                    </p>
                                </div>
                                <span className="badge badge-danger">
                                    {pendingTotal}
                                </span>
                            </Link>

                            <Link
                                href="/admin/moderation?type=expiry"
                                className="flex items-center justify-between rounded-tile border border-border p-3 transition-colors hover:bg-surface-muted"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Halal Certificate Expiries
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        Review vendor accreditation validity
                                    </p>
                                </div>
                                <span className="badge badge-warning">
                                    {expiringCertificatesCount}
                                </span>
                            </Link>

                            <Link
                                href="/admin/moderation?state=hidden"
                                className="flex items-center justify-between rounded-tile border border-border p-3 transition-colors hover:bg-surface-muted"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Hidden Content
                                    </p>
                                    <p className="text-body-sm text-muted-foreground">
                                        Items taken down pending seller revision
                                    </p>
                                </div>
                                <span className="badge badge-neutral">
                                    {hiddenTotal}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
