import { cn } from '@/lib/utils';

type BrandMarkProps = {
    name: string;
    showName?: boolean;
    markClassName?: string;
    className?: string;
};

export function BrandMark({
    name,
    showName = true,
    markClassName = 'size-8',
    className,
}: BrandMarkProps) {
    if (!showName) {
        return (
            <span className={cn('inline-flex shrink-0', className)}>
                <img
                    src="/brand/halalbenta-mark.svg"
                    alt={name || 'Brand icon'}
                    className={cn('object-contain dark:hidden', markClassName)}
                />
                <img
                    src="/brand/halalbenta-mark-dark.svg"
                    alt={name || 'Brand icon'}
                    className={cn(
                        'hidden object-contain dark:block',
                        markClassName,
                    )}
                />
            </span>
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
                src="/brand/halalbenta-wordmark.svg"
                alt={name}
                className="h-8 w-auto object-contain dark:hidden"
            />
            <img
                src="/brand/halalbenta-wordmark-dark.svg"
                alt={name}
                className="hidden h-8 w-auto object-contain dark:block"
            />
            <span className="sr-only">{name}</span>
        </span>
    );
}
