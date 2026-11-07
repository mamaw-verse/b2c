import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link> & {
    external?: boolean;
    current?: boolean;
};

export default function TextLink({
    className = '',
    children,
    external = false,
    current = false,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'font-bold text-primary underline decoration-1 underline-offset-2 transition-colors duration-token hover:text-primary-hover hover:decoration-2',
                className,
            )}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            aria-current={current ? 'page' : undefined}
            {...props}
        >
            {children}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
        </Link>
    );
}
