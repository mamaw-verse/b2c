import { CircleAlert } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p
            {...props}
            className={cn(
                'flex items-start gap-1 text-body-sm font-bold text-danger',
                className,
            )}
        >
            <CircleAlert className="mt-px size-4" aria-hidden="true" />
            <span>{message}</span>
        </p>
    );
}
