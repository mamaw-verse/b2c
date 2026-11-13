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
    prominent?: boolean;
    children?: ReactNode;
};

function Banner({
    tone = 'info',
    title,
    action,
    icon,
    live = false,
    prominent = false,
    className,
    children,
    ...props
}: BannerProps) {
    const [tileClasses, DefaultIcon] = tones[tone];
    const assertive = tone === 'danger' || tone === 'destructive';
    const prominentTone =
        tone === 'warning'
            ? 'border-l-warning bg-warning-soft'
            : 'border-l-danger bg-danger-soft';
    let role: 'alert' | 'status' | undefined;
    if (prominent || (live && assertive)) {
        role = 'alert';
    } else if (live) {
        role = 'status';
    }

    return (
        <div
            role={role}
            className={cn(
                'flex flex-col gap-3 rounded-panel border border-border bg-surface p-3 md:flex-row md:items-center md:gap-4 md:p-4',
                prominent && `border-l-4 ${prominentTone} p-4 md:p-5`,
                children && 'md:items-start',
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    'grid shrink-0 place-items-center rounded-tile',
                    prominent ? 'size-12' : 'size-9',
                    tileClasses,
                )}
            >
                {icon ?? (
                    <DefaultIcon
                        className={prominent ? 'size-6' : 'size-5'}
                        aria-hidden="true"
                    />
                )}
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
                {title && (
                    <p
                        className={cn(
                            'text-foreground',
                            prominent ? 'text-h3 font-semibold' : 'text-label',
                        )}
                    >
                        {title}
                    </p>
                )}
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
