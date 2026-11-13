import { ArrowLeft, Clock, FileBadge, Flag } from 'lucide-react';
import { type ReactNode } from 'react';
import { StatusPill, type ModerationState } from '@/components/status-pill';
import { ModerationActionBar } from '@/components/moderation-action-bar';
import {
    HalalVerificationChecklist,
    type ChecklistItem,
} from '@/components/halal-verification-checklist';
import { AuditLogList, type AuditEntry } from '@/components/audit-log-list';

export type ReportReasonTally = {
    label: string;
    count: number;
    percent: number;
};

export type ModerationDetailItem = {
    id: string;
    display_id: string;
    type: string;
    type_label: string;
    priority: string;
    title: string;
    state: ModerationState;
    age_label?: string;
    sla_label?: string;
    sla_left_label?: string;
    sla_warn?: boolean;
    sla_breach?: boolean;
    reports_count?: number;
    assignee?: string;
    decision_reason?: string;
};

export type ModerationDetailPaneProps = {
    item: ModerationDetailItem;
    preview?: ReactNode;
    checklist?: ChecklistItem[];
    reportReasons?: ReportReasonTally[];
    history?: AuditEntry[];
    onBack?: () => void;
    onDecide: (decision: {
        action: string;
        reason?: string;
        note?: string;
        internalNote?: boolean;
    }) => void;
    reasonTemplates?: string[];
    processing?: boolean;
};

export function ModerationDetailPane({
    item,
    preview,
    checklist,
    reportReasons = [],
    history = [],
    onBack,
    onDecide,
    reasonTemplates,
    processing = false,
}: ModerationDetailPaneProps) {
    const isHalal = item.type === 'halal' || item.type === 'expiry';
    const title =
        item.type === 'shop_application' ? 'Shop application' : item.title;
    const isResolved =
        item.state === 'resolved' ||
        item.state === 'hidden' ||
        item.state === 'suspended';

    return (
        <div className="h-full min-h-[36rem] overflow-hidden rounded-panel border border-border">
            <article
                className="flex h-full min-h-0 flex-col bg-background"
                aria-labelledby={`mdp-title-${item.id}`}
            >
                {/* Header */}
                <header className="flex items-center gap-2 border-b border-border bg-surface px-2 py-1 md:px-4">
                    {onBack && (
                        <button
                            type="button"
                            className="btn btn-icon btn-ghost text-foreground md:hidden"
                            aria-label="Back to queue"
                            onClick={onBack}
                        >
                            <ArrowLeft aria-hidden="true" className="icon" />
                        </button>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden py-1">
                        <p className="text-caption text-muted-foreground">
                            {item.type_label} ·{' '}
                            <span className="tabular">{item.display_id}</span> ·{' '}
                            {item.priority}
                        </p>
                        <h2
                            id={`mdp-title-${item.id}`}
                            className="truncate text-h4"
                            title={title}
                        >
                            {title}
                        </h2>
                    </div>
                    <StatusPill state={item.state} />
                </header>

                {/* Content body */}
                <div className="grid flex-1 content-start gap-4 overflow-y-auto p-gutter md:p-4">
                    {/* Context info strip */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
                        {(item.age_label || item.sla_label) && (
                            <span
                                className={`inline-flex items-center gap-1 font-bold ${
                                    item.sla_breach
                                        ? 'text-danger-text'
                                        : item.sla_warn
                                          ? 'text-warning-text'
                                          : 'text-muted-foreground'
                                }`}
                            >
                                <Clock aria-hidden="true" className="size-4" />
                                {item.age_label}
                                {item.sla_label && ` · SLA ${item.sla_label}`}
                                {item.sla_left_label &&
                                    ` (${item.sla_left_label})`}
                            </span>
                        )}
                        {item.reports_count !== undefined &&
                            item.reports_count > 0 && (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    <Flag
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {item.reports_count}{' '}
                                    {item.reports_count === 1
                                        ? 'report'
                                        : 'reports'}
                                </span>
                            )}
                        {item.assignee && (
                            <span className="text-muted-foreground">
                                Assigned to {item.assignee}
                            </span>
                        )}
                    </div>

                    {/* Reported content section */}
                    {preview && (
                        <section
                            className="panel p-4"
                            aria-labelledby={`mdp-content-${item.id}`}
                        >
                            <h3
                                id={`mdp-content-${item.id}`}
                                className="mb-3 text-label"
                            >
                                Reported content
                            </h3>
                            {preview}
                        </section>
                    )}

                    {/* Halal verification checklist if applicable */}
                    {isHalal && checklist && checklist.length > 0 && (
                        <section
                            className="panel p-4"
                            aria-labelledby={`mdp-halal-${item.id}`}
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h3
                                    id={`mdp-halal-${item.id}`}
                                    className="text-label"
                                >
                                    Halal verification
                                </h3>
                                <span className="badge badge-danger">
                                    <FileBadge
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    Checklist
                                </span>
                            </div>
                            <HalalVerificationChecklist items={checklist} />
                        </section>
                    )}

                    {/* Report reasons tally */}
                    {reportReasons.length > 0 && (
                        <section
                            className="panel p-4"
                            aria-labelledby={`mdp-reasons-${item.id}`}
                        >
                            <h3
                                id={`mdp-reasons-${item.id}`}
                                className="mb-3 text-label"
                            >
                                Report reasons
                            </h3>
                            <ul className="grid gap-2 text-body">
                                {reportReasons.map((r, i) => (
                                    <li
                                        key={i}
                                        className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
                                    >
                                        <span>{r.label}</span>
                                        <span className="tabular text-muted-foreground">
                                            {r.count}
                                        </span>
                                        <span
                                            className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"
                                            aria-hidden="true"
                                        >
                                            <span
                                                className="block h-full rounded-full bg-mod-flagged"
                                                style={{
                                                    width: `${r.percent}%`,
                                                }}
                                            />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* History section */}
                    <section
                        className="panel p-4"
                        aria-labelledby={`mdp-history-${item.id}`}
                    >
                        <h3
                            id={`mdp-history-${item.id}`}
                            className="mb-3 text-label"
                        >
                            History
                        </h3>
                        <AuditLogList entries={history} />
                    </section>
                </div>

                {/* Sticky Action Bar */}
                <ModerationActionBar
                    onDecide={onDecide}
                    templates={reasonTemplates}
                    processing={processing}
                    resolved={isResolved}
                    resolvedState={item.state}
                />
            </article>
        </div>
    );
}
