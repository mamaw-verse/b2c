import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
    info: ['bg-info-soft text-info-text', Info],
    success: ['bg-success-soft text-success-text', CircleCheck],
    warning: ['bg-warning-soft text-warning-text', TriangleAlert],
    danger: ['bg-danger-soft text-danger-text', CircleAlert],
    destructive: ['bg-danger-soft text-danger-text', TriangleAlert],
    default: ['bg-surface-muted text-muted-foreground', Info],
} as const;

type BannerProps = ComponentProps<'div'> & {
    tone?: keyof typeof tones;
    title?: string;
    action?: ReactNode;
    icon?: ReactNode;
    live?: boolean;
    children?: ReactNode;
};

function Banner({
    tone = 'info',
    title,
    action,
    icon,
    live = false,
    className,
    children,
    ...props
}: BannerProps) {
    const [tileClasses, DefaultIcon] = tones[tone];
    const assertive = tone === 'danger' || tone === 'destructive';

    return (
        <div
            role={live ? (assertive ? 'alert' : 'status') : undefined}
            className={cn(
                'flex flex-col gap-3 rounded-panel border border-border bg-surface p-3 md:flex-row md:items-center md:gap-4 md:p-4',
                children && 'md:items-start',
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-tile',
                    tileClasses,
                )}
            >
                {icon ?? <DefaultIcon className="size-5" aria-hidden="true" />}
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
                {title && <p className="text-label text-foreground">{title}</p>}
                {children && (
                    <div className="text-body-sm text-muted-foreground">
                        {children}
                    </div>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
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
