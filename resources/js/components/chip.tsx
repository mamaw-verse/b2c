import type { ComponentProps } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';

type ChipProps = ComponentProps<'button'> & {
    pressed?: boolean;
    icon?: string;
    count?: number | string;
};

export function Chip({
    pressed = false,
    icon,
    count,
    className,
    children,
    ...props
}: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            className={cn(
                'relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-control bg-surface px-3 text-label whitespace-nowrap text-foreground transition-colors duration-token after:absolute after:-inset-x-px after:-inset-y-[5px] hover:bg-surface-muted active:bg-border disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground',
                className,
            )}
            {...props}
        >
            {pressed ? (
                <DsIcon name="check" className="size-4" />
            ) : icon ? (
                <DsIcon name={icon} className="size-4" />
            ) : null}
            {children}
            {count != null && (
                <span className="text-muted-foreground">{count}</span>
            )}
        </button>
    );
}
