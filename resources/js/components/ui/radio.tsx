import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RadioProps = Omit<ComponentProps<'input'>, 'type'> & {
    label?: ReactNode;
    description?: ReactNode;
    card?: boolean;
};

function Radio({
    className,
    label,
    description,
    card = false,
    id,
    ...props
}: RadioProps) {
    const input = (
        <input
            id={id}
            type="radio"
            className={cn('mt-0.5 size-5 shrink-0 accent-primary', className)}
            {...props}
        />
    );

    if (!label && !description) {
        return input;
    }

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex min-h-touch items-start gap-3 py-2.5',
                card &&
                    'rounded-card border border-border bg-surface p-3 has-checked:border-primary has-checked:bg-primary-soft',
            )}
        >
            {input}
            <span className="grid gap-0.5">
                {label && <span className="text-body">{label}</span>}
                {description && (
                    <span className="text-body-sm text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
        </label>
    );
}

export { Radio };
