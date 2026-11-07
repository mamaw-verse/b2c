import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: ComponentProps<'input'>) {
    return (
        <input
            type="checkbox"
            data-slot="checkbox"
            className={cn('mt-0.5 size-5 shrink-0 accent-primary', className)}
            {...props}
        />
    );
}

export { Checkbox };
