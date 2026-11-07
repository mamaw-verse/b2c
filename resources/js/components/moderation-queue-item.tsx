import {
    AlarmClock,
    Clock,
    FileBadge,
    Flag,
    MessageSquareWarning,
    Scale,
    ShieldAlert,
    Star,
    Store,
    Tag,
} from 'lucide-react';
import { StatusPill, type ModerationState } from '@/components/status-pill';
import { cn } from '@/lib/utils';

export type SlaState = 'ok' | 'warn' | 'breach';

export type QueueItem = {
    id: string;
    display_id: string;
    type: string;
    type_label: string;
    title: string;
    excerpt?: string;
    state: ModerationState;
    age_sec: number;
    sla_sec: number;
    reports?: number;
    priority: 'P1' | 'P2' | 'P3';
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    listing: Tag,
    halal: FileBadge,
    report: Flag,
    keyword: Flag,
    expiry: FileBadge,
    chat: MessageSquareWarning,
    review: Star,
    seller_application: Store,
    shop: ShieldAlert,
    dispute: Scale,
};

const PRIORITY_CLASS: Record<string, string> = {
    P1: 'badge-danger',
    P2: 'badge-warning',
    P3: 'badge-neutral',
};

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h >= 24) {
        const d = Math.floor(h / 24);
        const rh = h % 24;
        return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
    }
    if (h > 0) {
        return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
    }
    return `${m}m`;
}

function getSlaState(ageSec: number, slaSec: number): SlaState {
    const remaining = slaSec - ageSec;
    if (remaining <= 0) {
        return 'breach';
    }
    if (remaining <= 900) {
        return 'warn';
    }
    return 'ok';
}

export function ModerationQueueItem({
    item,
    active = false,
    selectable = true,
    href,
    onSelect,
    checked = false,
}: {
    item: QueueItem;
    active?: boolean;
    selectable?: boolean;
    href: string;
    onSelect?: (checked: boolean) => void;
    checked?: boolean;
}) {
    const TypeIcon = TYPE_ICONS[item.type] ?? Flag;
    const slaState = getSlaState(item.age_sec, item.sla_sec);
    const ageLabel = formatDuration(item.age_sec);
    const slaLabel = formatDuration(item.sla_sec);

    return (
        <li
            aria-current={active ? 'true' : undefined}
            className={cn(
                'relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle md:px-3',
                'has-[:checked]:bg-primary-soft aria-[current=true]:bg-primary-soft',
            )}
        >
            {selectable && (
                <label className="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid">
                    <input
                        type="checkbox"
                        className="size-5 accent-primary"
                        checked={checked}
                        onChange={(e) => onSelect?.(e.target.checked)}
                    />
                    <span className="sr-only">Select {item.display_id}</span>
                </label>
            )}

            <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground">
                <TypeIcon aria-hidden="true" className="icon" />
            </span>

            <div className="grid min-w-0 flex-1 gap-1">
                <p className="flex items-center gap-2 text-caption text-muted-foreground">
                    <span>{item.type_label}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular">{item.display_id}</span>
                    <span
                        className={cn(
                            'badge ml-auto',
                            PRIORITY_CLASS[item.priority],
                        )}
                    >
                        <span className="sr-only">Priority </span>
                        {item.priority}
                    </span>
                </p>

                <p className="truncate text-label">
                    <a href={href} className="after:absolute after:inset-0">
                        {item.title}
                    </a>
                </p>

                {item.excerpt && (
                    <p className="line-clamp-1 text-body-sm text-muted-foreground">
                        {item.excerpt}
                    </p>
                )}

                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
                    <StatusPill state={item.state} />

                    <span
                        className={cn(
                            'inline-flex items-center gap-1 font-bold',
                            {
                                'text-warning': slaState === 'warn',
                                'text-danger': slaState === 'breach',
                                'text-muted-foreground': slaState === 'ok',
                            },
                        )}
                    >
                        {slaState === 'breach' ? (
                            <AlarmClock
                                aria-hidden="true"
                                className="size-3.5"
                            />
                        ) : (
                            <Clock aria-hidden="true" className="size-3.5" />
                        )}
                        <span>
                            <span className="sr-only">Age </span>
                            {ageLabel}
                            {slaState === 'breach'
                                ? ` · SLA ${slaLabel} breached`
                                : ` · SLA ${slaLabel}`}
                        </span>
                    </span>

                    {!!item.reports && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Flag aria-hidden="true" className="size-3.5" />
                            {item.reports}{' '}
                            {item.reports === 1 ? 'report' : 'reports'}
                        </span>
                    )}
                </p>
            </div>
        </li>
    );
}
