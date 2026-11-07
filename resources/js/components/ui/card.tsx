import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/utils';

type CardProps = ComponentProps<'div'> & {
    as?: ElementType;
    interactive?: boolean;
    selected?: boolean;
};

function Card({
    className,
    as: Comp = 'div',
    interactive = false,
    selected = false,
    ...props
}: CardProps) {
    return (
        <Comp
            data-slot="card"
            data-selected={selected || undefined}
            className={cn(
                interactive ? 'card card-interactive' : 'card',
                'flex flex-col gap-6 py-6',
                className,
            )}
            {...props}
        />
    );
}

function Panel({ className, ...props }: ComponentProps<'section'>) {
    return (
        <section
            data-slot="panel"
            className={cn('panel', className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn('flex flex-col gap-1.5 px-4 md:px-6', className)}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-title"
            className={cn('text-h4', className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-description"
            className={cn('text-body-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-content"
            className={cn('px-4 md:px-6', className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn('flex items-center px-4 md:px-6', className)}
            {...props}
        />
    );
}

export {
    Card,
    Panel,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
};
