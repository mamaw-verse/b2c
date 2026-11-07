import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import {
    QueueFilterBar,
    type QueueFilters,
} from '@/components/queue-filter-bar';
import { BulkActionBar } from '@/components/bulk-action-bar';
import {
    ModerationQueueItem,
    type QueueItem,
} from '@/components/moderation-queue-item';
import { store as bulkDecide } from '@/actions/App/Http/Controllers/Admin/BulkModerationDecisionController';
import type { ModerationState } from '@/components/status-pill';

type RawModerationItem = {
    id: string;
    type: string;
    state: ModerationState;
    reason_code?: string;
    created_at: string;
    target?: {
        name?: string;
        title?: string;
        text?: string;
        shop_name?: string;
    } | null;
    target_type?: string;
};

type CursorPaginator<T> = {
    data: T[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
};

export default function ModerationIndex({
    queue,
    filters = {},
}: {
    queue: CursorPaginator<RawModerationItem>;
    filters?: QueueFilters & {
        state?: string;
        type?: string;
        sla_days?: number;
    };
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    const typeCounts = [
        { value: 'halal', label: 'Halal checks', count: 0 },
        { value: 'report', label: 'Reports', count: 0 },
        { value: 'keyword', label: 'Keyword flags', count: 0 },
        { value: 'expiry', label: 'Cert expiries', count: 0 },
        { value: 'general', label: 'General', count: 0 },
    ];

    // Map Raw items to QueueItem format
    const items: QueueItem[] = queue.data.map((raw) => {
        const createdAt = new Date(raw.created_at).getTime();
        const now = Date.now();
        const ageSec = Math.max(0, Math.floor((now - createdAt) / 1000));
        const slaSec = 14400; // 4 hour default SLA

        // Derive title & excerpt based on target or type
        const targetTitle =
            raw.target?.title ??
            raw.target?.name ??
            (raw.target?.text ? raw.target.text.slice(0, 60) : null) ??
            `${raw.type.toUpperCase()} check: ${raw.reason_code ?? 'Manual review'}`;

        const excerpt =
            raw.reason_code ??
            (raw.target?.shop_name
                ? `Listed by ${raw.target.shop_name}`
                : undefined);

        const priority: 'P1' | 'P2' | 'P3' =
            raw.type === 'halal' || raw.type === 'expiry'
                ? 'P1'
                : raw.type === 'keyword' || raw.type === 'report'
                  ? 'P2'
                  : 'P3';

        return {
            id: raw.id,
            display_id: `MQ-${raw.id.slice(-5).toUpperCase()}`,
            type: raw.type,
            type_label:
                raw.type === 'halal'
                    ? 'Halal check'
                    : raw.type === 'expiry'
                      ? 'Expiry check'
                      : raw.type === 'report'
                        ? 'Report'
                        : raw.type === 'keyword'
                          ? 'Keyword'
                          : 'General',
            title: targetTitle,
            excerpt,
            state: raw.state,
            age_sec: ageSec,
            sla_sec: slaSec,
            priority,
        };
    });

    const handleFilterChange = (newFilters: QueueFilters) => {
        router.get(
            '/admin/moderation',
            {
                q: newFilters.q,
                type: newFilters.types?.[0],
                state: newFilters.states?.[0],
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const toggleSelectItem = (id: string, checked: boolean) => {
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((i) => i !== id),
        );
    };

    const handleBulkAction = (action: 'approved' | 'rejected' | 'hidden') => {
        if (selectedIds.length === 0) return;
        setProcessing(true);
        router.post(
            bulkDecide.url(),
            {
                ids: selectedIds,
                action,
                reason: `Bulk ${action} by moderator`,
            },
            {
                onFinish: () => {
                    setProcessing(false);
                    setSelectedIds([]);
                },
            },
        );
    };

    return (
        <AdminLayout pendingQueueCount={items.length}>
            <Head title="Moderation Queue" />

            <div className="mx-auto max-w-container p-gutter py-6 md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-h2">Moderation Queue</h1>
                        <p className="text-body-sm text-muted-foreground">
                            Inspect flagged listings, halal certifications, and
                            user reports.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-panel border border-border bg-surface">
                    {/* Filter Bar */}
                    <QueueFilterBar
                        filters={{
                            q: filters.q,
                            types: filters.type ? [filters.type] : undefined,
                            states: filters.state ? [filters.state] : undefined,
                        }}
                        typeCounts={typeCounts}
                        onChange={handleFilterChange}
                    />

                    {/* Bulk Action Bar */}
                    <BulkActionBar
                        selectedCount={selectedIds.length}
                        processing={processing}
                        onApprove={() => handleBulkAction('approved')}
                        onReject={() => handleBulkAction('rejected')}
                        onHide={() => handleBulkAction('hidden')}
                        onClearSelection={() => setSelectedIds([])}
                    />

                    {/* Queue List */}
                    {items.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-h4 text-foreground">
                                Queue is clear
                            </p>
                            <p className="mt-1 text-body-sm text-muted-foreground">
                                No items currently require moderation under the
                                selected filters.
                            </p>
                        </div>
                    ) : (
                        <ul
                            className="divide-y divide-border"
                            aria-label="Moderation queue"
                        >
                            {items.map((item) => (
                                <ModerationQueueItem
                                    key={item.id}
                                    item={item}
                                    href={`/admin/moderation/${item.id}`}
                                    checked={selectedIds.includes(item.id)}
                                    onSelect={(checked) =>
                                        toggleSelectItem(item.id, checked)
                                    }
                                />
                            ))}
                        </ul>
                    )}

                    {/* Cursor pagination links */}
                    {(queue.next_page_url || queue.prev_page_url) && (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3">
                            <div>
                                {queue.prev_page_url && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.get(queue.prev_page_url!)
                                        }
                                        className="btn btn-neutral btn-sm"
                                    >
                                        Previous
                                    </button>
                                )}
                            </div>
                            <div>
                                {queue.next_page_url && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.get(queue.next_page_url!)
                                        }
                                        className="btn btn-neutral btn-sm"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
