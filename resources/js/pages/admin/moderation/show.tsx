import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ModerationDetailPane,
    type ModerationDetailItem,
    type ReportReasonTally,
} from '@/components/moderation-detail-pane';
import { ContentPreview } from '@/components/content-preview';
import { type ChecklistItem } from '@/components/halal-verification-checklist';
import { type AuditEntry } from '@/components/audit-log-list';
import { store as makeDecision } from '@/actions/App/Http/Controllers/Admin/ModerationDecisionController';
import type { ModerationState } from '@/components/status-pill';

type RawEvent = {
    id: string;
    action: string;
    reason?: string | null;
    created_at: string;
    admin?: {
        name: string;
    } | null;
};

type RawItem = {
    id: string;
    type: string;
    state: ModerationState;
    reason_code?: string;
    created_at: string;
    decision_reason?: string;
    target_type?: string;
    target_id?: string;
    target?: {
        id?: string;
        title?: string;
        name?: string;
        price?: number;
        text?: string;
        rating?: number;
        ingredients?: string;
        halal?: string;
        halal_status?: string;
        photos?: string[];
        image_url?: string;
        shop?: {
            name: string;
            slug?: string;
        };
        shop_name?: string;
        user?: {
            name: string;
        };
    } | null;
    flagged_by?: {
        name?: string;
    } | null;
    resolved_by?: {
        name?: string;
    } | null;
    events?: RawEvent[];
};

type Preview = {
    kind: 'product' | 'review' | 'chat' | 'unknown';
    snapshot: Record<string, unknown>;
};

export default function ModerationShow({
    item,
    preview,
}: {
    item: RawItem;
    preview: Preview;
}) {
    const [processing, setProcessing] = useState(false);

    // Compute age & SLA
    const createdAt = new Date(item.created_at).getTime();
    const ageSec = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    const hours = Math.floor(ageSec / 3600);
    const mins = Math.floor((ageSec % 3600) / 60);
    const ageLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const slaSec = 14400; // 4h
    const remainingSec = slaSec - ageSec;
    const slaBreach = remainingSec <= 0;
    const slaWarn = !slaBreach && remainingSec <= 900;
    const slaLeftLabel = slaBreach
        ? 'breached'
        : `${Math.max(1, Math.floor(remainingSec / 60))} min left`;

    const displayId = `MQ-${item.id.slice(-5).toUpperCase()}`;

    // Target display data
    const targetTitle =
        item.target?.title ??
        item.target?.name ??
        (item.target?.text ? item.target.text.slice(0, 60) : null) ??
        `${item.type.toUpperCase()} review: ${item.reason_code ?? 'Manual check'}`;

    const detailItem: ModerationDetailItem = {
        id: item.id,
        display_id: displayId,
        type: item.type,
        type_label:
            item.type === 'halal'
                ? 'Halal check'
                : item.type === 'expiry'
                  ? 'Expiry check'
                  : item.type === 'report'
                    ? 'Report'
                    : item.type === 'keyword'
                      ? 'Keyword'
                      : 'General',
        priority:
            item.type === 'halal' || item.type === 'expiry'
                ? 'P1'
                : item.type === 'keyword' || item.type === 'report'
                  ? 'P2'
                  : 'P3',
        title: targetTitle,
        state: item.state,
        age_label: ageLabel,
        sla_label: '4h',
        sla_left_label: slaLeftLabel,
        sla_warn: slaWarn,
        sla_breach: slaBreach,
        reports_count: undefined,
        assignee: undefined,
        decision_reason: item.decision_reason,
    };

    const previewKind = preview.kind === 'unknown' ? null : preview.kind;
    const previewSnapshot = preview.snapshot;

    // Halal checklist items
    const checklist: ChecklistItem[] = [
        {
            question: 'Halal certificate attached',
            result: item.type === 'expiry' ? 'fail' : 'unknown',
            note:
                item.type === 'expiry'
                    ? 'Certificate is expired on record.'
                    : 'Check attached document.',
        },
        {
            question: 'Certifier is on the current accredited list',
            result: 'unknown',
            note: 'Verify against NCMF / IDCP registry.',
        },
        {
            question: 'Certificate is valid today',
            result: item.type === 'expiry' ? 'fail' : 'pass',
            note:
                item.type === 'expiry'
                    ? 'Expired before SLA deadline.'
                    : 'Validity verified on issue date.',
        },
        {
            question:
                'Ingredients contain no pork, alcohol or their derivatives',
            result: item.reason_code?.includes('ingredient') ? 'fail' : 'pass',
            note: item.reason_code?.includes('ingredient')
                ? 'Flagged prohibited keyword found in ingredient list.'
                : 'No prohibited ingredients flagged.',
        },
    ];

    // Report reasons tally
    const reportReasons: ReportReasonTally[] = [];

    // History audit entries
    const history: AuditEntry[] = (item.events ?? []).map((ev) => ({
        id: ev.id,
        actor: ev.admin?.name ?? 'System',
        action: ev.action,
        detail: ev.reason ?? undefined,
        at: new Date(ev.created_at).toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }),
        is_system: !ev.admin,
    }));

    // If history is empty, add the initial enqueue event
    if (history.length === 0) {
        history.push({
            actor: item.flagged_by?.name ?? 'System',
            action: 'Auto-flagged item',
            detail: item.reason_code ?? 'Enqueued for moderator inspection',
            at: new Date(item.created_at).toLocaleString('en-PH', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }),
            is_system: !item.flagged_by,
        });
    }

    const handleDecision = (decision: {
        action: string;
        reason?: string;
        note?: string;
        internalNote?: boolean;
    }) => {
        setProcessing(true);
        router.post(
            makeDecision.url({ moderationQueueItem: item.id }),
            {
                action: decision.action,
                reason:
                    decision.reason ?? decision.note ?? 'Decided by moderator',
            },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AdminLayout>
            <Head title={`Moderation - ${displayId}`} />

            <div className="mx-auto max-w-container p-gutter py-6 md:p-6">
                <ModerationDetailPane
                    item={detailItem}
                    preview={
                        previewKind ? (
                            <ContentPreview
                                kind={previewKind}
                                snapshot={previewSnapshot}
                            />
                        ) : (
                            <p className="text-body-sm text-muted-foreground">
                                No preview available for this target type.
                            </p>
                        )
                    }
                    checklist={checklist}
                    reportReasons={reportReasons}
                    history={history}
                    onBack={() => router.get('/admin/moderation')}
                    onDecide={handleDecision}
                    processing={processing}
                />
            </div>
        </AdminLayout>
    );
}
