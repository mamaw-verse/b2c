import { Ban, CheckCircle, Clock, EyeOff, Flag } from 'lucide-react';

export type ModerationState =
    | 'pending'
    | 'flagged'
    | 'hidden'
    | 'suspended'
    | 'resolved';

const STATE_CONFIG: Record<
    ModerationState,
    { label: string; icon: React.ElementType; className: string }
> = {
    pending: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-mod-pending-bg text-mod-pending',
    },
    flagged: {
        label: 'Flagged',
        icon: Flag,
        className: 'bg-mod-flagged-bg text-mod-flagged',
    },
    hidden: {
        label: 'Hidden',
        icon: EyeOff,
        className: 'bg-mod-hidden-bg text-mod-hidden',
    },
    suspended: {
        label: 'Suspended',
        icon: Ban,
        className: 'bg-mod-suspended-bg text-mod-suspended',
    },
    resolved: {
        label: 'Resolved',
        icon: CheckCircle,
        className: 'bg-mod-resolved-bg text-mod-resolved',
    },
};

export function StatusPill({
    state,
    label,
}: {
    state: ModerationState;
    label?: string;
}) {
    const config = STATE_CONFIG[state] ?? STATE_CONFIG.pending;
    const Icon = config.icon;
    const displayLabel = label ?? config.label;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-bold whitespace-nowrap ${config.className}`}
        >
            <Icon aria-hidden="true" className="size-3.5" />
            {displayLabel}
        </span>
    );
}
