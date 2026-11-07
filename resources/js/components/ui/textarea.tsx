import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function TextArea({
    className,
    rows = 4,
    ...props
}: ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            rows={rows}
            className={cn('field', className)}
            {...props}
        />
    );
}

export { TextArea };
