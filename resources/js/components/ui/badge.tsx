import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('badge', {
    variants: {
        variant: {
            default: '',
            neutral: 'badge-neutral',
            secondary: '',
            sale: 'badge-sale',
            'sale-solid': 'badge-sale-solid',
            success: 'badge-success',
            warning: 'badge-warning',
            danger: 'badge-danger',
            destructive: 'badge-danger',
            info: 'badge-info',
            solid: 'badge-solid',
            halal: 'badge-halal',
            'halal-solid': 'badge-halal-solid',
            outline: 'border border-border bg-surface text-foreground',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span';

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
