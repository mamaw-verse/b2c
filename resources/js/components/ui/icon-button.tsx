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
    const isPlain = variant === 'plain';

    return (
        <Button
            variant={variant}
            size={isPlain ? 'default' : size}
            className={cn(
                isPlain
                    ? 'relative inline-flex size-4 shrink-0 items-center justify-center rounded-xs transition-colors duration-token after:absolute after:-inset-3.5 after:content-[""] [&>svg]:size-4'
                    : 'btn-icon',
                className,
            )}
            aria-label={accessibleLabel}
            aria-pressed={pressed}
            {...props}
        >
            {icon}
            {typeof count === 'number' && count > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-caption leading-5 text-primary-foreground"
                >
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Button>
    );
}

export { IconButton };
