import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type SkeletonProps = ComponentProps<'span'> & {
    label?: string;
    wrapperClassName?: string;
};

function Skeleton({
    className,
    wrapperClassName,
    label = 'Loading',
    ...props
}: SkeletonProps) {
    return (
        <span aria-busy="true" className={wrapperClassName}>
            <span className="sr-only">{label}</span>
            <span
                data-slot="skeleton"
                aria-hidden="true"
                className={cn(
                    'block animate-pulse rounded-badge bg-surface-muted',
                    className,
                )}
                {...props}
            />
        </span>
    );
}

export { Skeleton };
