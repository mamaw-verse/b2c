import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva('btn', {
    variants: {
        variant: {
            default: '',
            primary: '',
            secondary: 'btn-secondary',
            outline: 'btn-outline',
            ghost: 'btn-ghost',
            neutral: 'btn-neutral',
            danger: 'btn-danger',
            destructive: 'btn-danger',
            inverse: 'btn-inverse',
            link: 'min-h-0 border-0 bg-transparent p-0 font-bold text-primary underline decoration-1 underline-offset-2 hover:bg-transparent hover:text-primary-hover hover:decoration-2',
        },
        size: {
            default: '',
            sm: 'btn-sm',
            md: '',
            lg: 'btn-lg',
            icon: 'btn-icon',
        },
        block: {
            true: 'btn-block',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

type ButtonProps = ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        loading?: boolean;
        icon?: ReactNode;
        iconEnd?: ReactNode;
    };

function Button({
    className,
    variant,
    size,
    block,
    asChild = false,
    loading = false,
    disabled,
    icon,
    iconEnd,
    children,
    type = 'button',
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : 'button';
    const isLoading = loading || props['aria-busy'] === true;

    return (
        <Comp
            data-slot="button"
            type={asChild ? undefined : type}
            className={cn(buttonVariants({ variant, size, block, className }))}
            aria-busy={isLoading || undefined}
            aria-disabled={isLoading || props['aria-disabled']}
            disabled={asChild ? undefined : disabled}
            {...props}
        >
            {asChild ? (
                children
            ) : (
                <>
                    {isLoading ? <Spinner aria-hidden="true" /> : icon}
                    {children}
                    {iconEnd}
                </>
            )}
        </Comp>
    );
}

export { Button, buttonVariants };
