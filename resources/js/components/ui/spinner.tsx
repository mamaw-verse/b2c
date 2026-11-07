import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type SpinnerProps = ComponentProps<'span'> & {
    label?: string;
    block?: boolean;
};

function Spinner({
    className,
    label = 'Loading',
    block = false,
    ...props
}: SpinnerProps) {
    if (block) {
        return (
            <span
                role="status"
                className={cn(
                    'flex flex-col items-center gap-2 text-primary',
                    className,
                )}
                {...props}
            >
                <span
                    aria-hidden="true"
                    className="inline-block size-8 animate-spin rounded-full border-[3px] border-current border-r-transparent"
                />
                <span className="text-body-sm text-muted-foreground">
                    {label}
                </span>
            </span>
        );
    }

    return (
        <span
            role={props['aria-hidden'] ? undefined : 'status'}
            aria-label={props['aria-hidden'] ? undefined : label}
            className={cn(
                'inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent',
                className,
            )}
            {...props}
        />
    );
}

export { Spinner };
