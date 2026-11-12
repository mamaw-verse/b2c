import { cn } from '@/lib/utils';

type BrandMarkProps = {
    name: string;
    showName?: boolean;
    className?: string;
};

export function BrandMark({
    name,
    showName = true,
    className,
}: BrandMarkProps) {
    if (!showName) {
        return (
            <img
                src="/images/brand/icon.png"
                alt={name || 'Brand icon'}
                className={cn('size-8 shrink-0 object-contain', className)}
            />
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 text-primary-text',
                className,
            )}
        >
            <img
                src="/images/brand/logo.png"
                alt={name}
                className="h-8 w-auto object-contain dark:hidden"
            />
            <img
                src="/images/brand/logo-dark.png"
                alt={name}
                className="hidden h-8 w-auto object-contain dark:block"
            />
            <span className="sr-only">{name}</span>
        </span>
    );
}
