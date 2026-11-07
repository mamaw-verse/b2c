import {
    CircleAlert,
    Clock,
    CalendarClock,
    FileBadge,
    HandHeart,
    MoonStar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HalalStatus } from '@/types/catalogue';

const HALAL: Record<
    HalalStatus,
    {
        icon: typeof MoonStar;
        label: string;
        short: string;
        cls: string;
        solid?: string;
    }
> = {
    certified: {
        icon: MoonStar,
        label: 'Halal certified',
        short: 'Halal',
        cls: 'badge-halal',
        solid: 'badge-halal-solid',
    },
    review: {
        icon: Clock,
        label: 'Certificate under review',
        short: 'In review',
        cls: 'badge-warning',
    },
    expiring: {
        icon: CalendarClock,
        label: 'Certificate expires soon',
        short: 'Expiring',
        cls: 'badge-warning',
    },
    expired: {
        icon: CircleAlert,
        label: 'Certificate expired',
        short: 'Expired',
        cls: 'badge-danger',
    },
    missing: {
        icon: FileBadge,
        label: 'No certificate',
        short: 'No certificate',
        cls: 'badge-danger',
    },
    na: {
        icon: HandHeart,
        label: 'Muslim-friendly (no certificate needed)',
        short: 'Muslim-friendly',
        cls: 'badge-neutral',
    },
};

type HalalBadgeProps = {
    status: HalalStatus;
    short?: boolean;
    solid?: boolean;
    body?: string | null;
    showBody?: boolean;
    className?: string;
};

export function HalalBadge({
    status,
    short = false,
    solid = false,
    body,
    showBody = false,
    className,
}: HalalBadgeProps) {
    const s = HALAL[status];
    const tone = solid && s.solid ? s.solid : s.cls;
    const Icon = s.icon;

    return (
        <span className={cn('badge', tone, className)}>
            <Icon aria-hidden="true" className="size-3.5" />
            {short ? s.short : s.label}
            {short && status === 'certified' && (
                <span className="sr-only">
                    {' certified'}
                    {body ? ` by ${body}` : ''}
                </span>
            )}
            {showBody && body && (
                <span className="font-normal opacity-90">· {body}</span>
            )}
        </span>
    );
}
