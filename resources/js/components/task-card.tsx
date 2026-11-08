import { Link } from '@inertiajs/react';
import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';

export interface TaskCardProps {
    count: number | string;
    label: string;
    ic?: string;
    href?: string;
    tone?: string;
    urgent?: boolean;
    className?: string;
}

export function TaskCard({
    count,
    label,
    ic = 'package',
    href = '#',
    tone = 'text-primary-text',
    urgent = false,
    className,
}: TaskCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                'card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline',
                className,
            )}
        >
            <span
                className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-tile',
                    urgent
                        ? 'bg-promo-soft text-promo'
                        : cn('bg-primary-soft', tone),
                )}
            >
                <DsIcon name={ic} className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1">
                <span className="tabular text-h3">{count}</span>
                <span className="text-body-sm text-muted-foreground">
                    {label}
                </span>
            </span>
            <DsIcon
                name="chevron-right"
                className="size-4 text-muted-foreground"
            />
        </Link>
    );
}

export function TaskGrid({ tasks }: { tasks: TaskCardProps[] }) {
    return (
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            {tasks.map((task, i) => (
                <li key={i}>
                    <TaskCard {...task} />
                </li>
            ))}
        </ul>
    );
}
