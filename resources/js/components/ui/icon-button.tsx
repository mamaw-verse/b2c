import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
    icon: ReactNode;
    label: string;
    count?: number;
    pressed?: boolean;
};

function IconButton({
    icon,
    label,
    count,
    pressed,
    className,
    variant = 'ghost',
    size = 'md',
    ...props
}: IconButtonProps) {
    const accessibleLabel = count ? `${label}, ${count}` : label;

    return (
        <Button
            variant={variant}
            size={size}
            className={cn('btn-icon', className)}
            aria-label={accessibleLabel}
            aria-pressed={pressed}
            {...props}
        >
            {icon}
            {typeof count === 'number' && count > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground"
                >
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Button>
    );
}

export { IconButton };
