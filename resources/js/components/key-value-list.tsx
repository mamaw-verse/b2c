import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type KeyValueListProps = {
    rows: [string, ReactNode][];
    cols?: 1 | 2;
    className?: string;
};

export function KeyValueList({ rows, cols = 1, className }: KeyValueListProps) {
    return (
        <dl
            className={cn(
                'grid gap-x-6 gap-y-3',
                cols === 2 && 'sm:grid-cols-2',
                className,
            )}
        >
            {rows.map(([key, value], i) => (
                <div
                    key={i}
                    className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3"
                >
                    <dt className="text-body-sm text-muted-foreground">
                        {key}
                    </dt>
                    <dd className="text-body text-foreground">{value}</dd>
                </div>
            ))}
        </dl>
    );
}
