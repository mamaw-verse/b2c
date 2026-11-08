import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = ComponentProps<'div'> & {
    icon?: LucideIcon;
    title: string;
    text?: string;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    compact?: boolean;
};

function EmptyState({
    icon: Icon = Inbox,
    title,
    text,
    action,
    secondaryAction,
    compact = false,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'mx-auto flex max-w-sm flex-col items-center gap-3 text-center',
                compact ? 'py-6' : 'py-10',
                className,
            )}
            {...props}
        >
            <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary-text">
                <Icon className="size-8" aria-hidden="true" />
            </span>
            <h3 className="text-h3">{title}</h3>
            {text && <p className="text-body text-muted-foreground">{text}</p>}
            {(action || secondaryAction) && (
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                    {action}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
}

export { EmptyState };
