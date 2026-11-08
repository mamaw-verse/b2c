import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StickyActionBarProps = {
    children: ReactNode;
    fixed?: boolean;
    className?: string;
};

/**
 * Fixed bottom bar on phone/tablet; becomes static inline at lg.
 * Pages using it must add bottom padding and hide the bottom tab bar.
 */
export function StickyActionBar({
    children,
    fixed = true,
    className,
}: StickyActionBarProps) {
    return (
        <div
            className={cn(
                fixed ? 'fixed inset-x-0 bottom-0 z-sticky-bar' : 'relative',
                'border-t border-border bg-surface pb-safe shadow-sticky lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:shadow-none',
                className,
            )}
        >
            <div className="mx-auto flex max-w-container items-stretch gap-2 py-2 max-lg:px-gutter lg:py-0">
                {children}
            </div>
        </div>
    );
}
