import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SwitchProps = Omit<ComponentProps<'input'>, 'type'> & {
    label?: ReactNode;
    description?: ReactNode;
};

function Switch({ className, label, description, id, ...props }: SwitchProps) {
    const input = (
        <input
            id={id}
            type="checkbox"
            role="switch"
            className={cn(
                'relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:top-1 before:left-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60',
                className,
            )}
            {...props}
        />
    );

    if (!label && !description) {
        return input;
    }

    return (
        <label
            htmlFor={id}
            className="flex min-h-touch items-center justify-between gap-4 py-2"
        >
            <span className="grid gap-0.5">
                {label && <span className="text-body">{label}</span>}
                {description && (
                    <span className="text-body-sm text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
            {input}
        </label>
    );
}

export { Switch };
