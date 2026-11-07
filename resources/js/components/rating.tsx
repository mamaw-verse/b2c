import { Star } from 'lucide-react';
import { compactCount } from '@/lib/format';
import { cn } from '@/lib/utils';

type RatingProps = {
    value: number;
    count?: number;
    size?: string;
    showValue?: boolean;
    label?: string;
    className?: string;
};

/** Decorative stars + numeric value; colour is never the only carrier. */
export function Rating({
    value,
    count,
    size = 'size-4',
    showValue = true,
    label,
    className,
}: RatingProps) {
    return (
        <span
            role="img"
            aria-label={
                label ??
                `Rated ${value} out of 5${count != null ? `, ${compactCount(count)} ratings` : ''}`
            }
            className={cn('inline-flex items-center gap-1', className)}
        >
            <span aria-hidden="true" className="inline-flex">
                {[1, 2, 3, 4, 5].map((n) =>
                    value >= n - 0.5 && value < n ? (
                        <span key={n} className="relative inline-flex">
                            <Star
                                className={cn(
                                    size,
                                    'fill-current stroke-0 text-border-strong',
                                )}
                            />
                            <span className="absolute inset-0 w-1/2 overflow-hidden">
                                <Star
                                    className={cn(
                                        size,
                                        'fill-current stroke-0 text-rating',
                                    )}
                                />
                            </span>
                        </span>
                    ) : (
                        <Star
                            key={n}
                            className={cn(
                                size,
                                'fill-current stroke-0',
                                value >= n
                                    ? 'text-rating'
                                    : 'text-border-strong',
                            )}
                        />
                    ),
                )}
            </span>
            {showValue && (
                <span
                    aria-hidden="true"
                    className="tabular text-body-sm font-bold text-foreground"
                >
                    {value.toFixed(1)}
                </span>
            )}
            {count != null && (
                <span
                    aria-hidden="true"
                    className="text-body-sm text-muted-foreground"
                >
                    ({compactCount(count)})
                </span>
            )}
        </span>
    );
}
