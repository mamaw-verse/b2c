import type { LucideIcon } from 'lucide-react';
import { RefreshCw, WifiOff } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorStateProps = ComponentProps<'div'> & {
    icon?: LucideIcon;
    title?: string;
    text?: string;
    code?: string;
    retryLabel?: string;
    onRetry?: () => void;
};

function ErrorState({
    icon: Icon = WifiOff,
    title = 'Something went wrong',
    text = 'We could not load this page. Check your connection and try again.',
    code,
    retryLabel = 'Try again',
    onRetry,
    className,
    ...props
}: ErrorStateProps) {
    return (
        <div
            role="alert"
            className={cn(
                'mx-auto flex max-w-sm flex-col items-center gap-3 py-10 text-center',
                className,
            )}
            {...props}
        >
            <span className="grid size-16 place-items-center rounded-full bg-danger-soft text-danger-text">
                <Icon className="size-8" aria-hidden="true" />
            </span>
            <h3 className="text-h3">{title}</h3>
            <p className="text-body text-muted-foreground">{text}</p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    <RefreshCw aria-hidden="true" />
                    <span>{retryLabel}</span>
                </Button>
            )}
            {code && (
                <p className="text-caption text-muted-foreground">
                    Error code: <span className="tabular">{code}</span>
                </p>
            )}
        </div>
    );
}

export { ErrorState };
