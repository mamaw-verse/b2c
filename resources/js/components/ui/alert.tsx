import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
    info: ['bg-info-soft border-info text-info', Info],
    success: ['bg-success-soft border-success text-success', CircleCheck],
    warning: ['bg-warning-soft border-warning text-warning', TriangleAlert],
    danger: ['bg-danger-soft border-danger text-danger', CircleAlert],
    destructive: ['bg-danger-soft border-danger text-danger', CircleAlert],
    default: ['bg-surface-muted border-border text-foreground', Info],
} as const;

type BannerProps = ComponentProps<'div'> & {
    tone?: keyof typeof tones;
    title?: string;
    action?: ReactNode;
    live?: boolean;
    children?: ReactNode;
};

function Banner({
    tone = 'info',
    title,
    action,
    live = false,
    className,
    children,
    ...props
}: BannerProps) {
    const [classes, Icon] = tones[tone];

    return (
        <div
            role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}
            className={cn(
                'flex items-start gap-3 rounded-panel border-l-4 p-3 md:p-4',
                classes,
                className,
            )}
            {...props}
        >
            <Icon className="mt-0.5 size-5" aria-hidden="true" />
            <div className="grid flex-1 gap-1">
                {title && <p className="text-label">{title}</p>}
                <div className="text-body text-foreground">{children}</div>
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}

function Alert({
    className,
    variant = 'default',
    ...props
}: ComponentProps<'div'> & { variant?: keyof typeof tones }) {
    return (
        <Banner
            tone={variant}
            live={variant === 'danger' || variant === 'destructive'}
            className={className}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
    return <div className={cn('text-label', className)} {...props} />;
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={cn('text-body-sm text-foreground', className)}
            {...props}
        />
    );
}

export { Alert, AlertTitle, AlertDescription, Banner };
