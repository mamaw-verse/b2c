import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    label: string;
    value: string | number;
    delta?: string;
    up?: boolean;
    ic?: string;
    hint?: string;
    className?: string;
}

export function StatCard({
    label,
    value,
    delta,
    up = true,
    ic,
    hint = 'vs last 7 days',
    className,
}: StatCardProps) {
    return (
        <div className={cn('card grid gap-1 p-4', className)}>
            <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
                {ic && <DsIcon name={ic} className="size-4" />}
                {label}
            </p>
            <p className="tabular text-h2">{value}</p>
            {delta && (
                <p
                    className={cn(
                        'flex items-center gap-1 text-body-sm font-bold',
                        up ? 'text-success' : 'text-danger',
                    )}
                >
                    <DsIcon
                        name={up ? 'trending-up' : 'trending-down'}
                        className="size-4"
                    />
                    <span>{delta}</span>
                    <span className="sr-only">
                        {up ? 'increase' : 'decrease'}
                    </span>
                    <span className="font-normal text-muted-foreground">
                        {hint}
                    </span>
                </p>
            )}
        </div>
    );
}
