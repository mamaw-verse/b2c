import { Badge } from '@/components/ui/badge';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

type PriceBlockProps = {
    price: number;
    was?: number | null;
    size?: 'sm' | 'md' | 'lg';
    max?: number;
    unit?: string;
    pctBadge?: boolean;
    className?: string;
};

export function PriceBlock({
    price,
    was,
    size = 'md',
    max,
    unit,
    pctBadge = true,
    className,
}: PriceBlockProps) {
    const cls =
        size === 'lg'
            ? 'text-price-lg'
            : size === 'sm'
              ? 'text-body font-extrabold'
              : 'text-price';
    const now = max
        ? `${formatPeso(price)} – ${formatPeso(max)}`
        : formatPeso(price);

    return (
        <p
            className={cn(
                'flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5',
                className,
            )}
        >
            {was ? <span className="sr-only">Sale price:</span> : null}
            <span
                data-price
                className={cn(cls, was ? 'text-sale' : 'text-foreground')}
            >
                {now}
            </span>
            {unit && (
                <span className="text-body-sm text-muted-foreground">
                    / {unit}
                </span>
            )}
            {was ? (
                <>
                    <span className="sr-only">Original price:</span>
                    <s
                        data-price
                        className={cn(
                            size === 'lg' ? 'text-body' : 'text-body-sm',
                            'text-muted-foreground',
                        )}
                    >
                        {formatPeso(was)}
                    </s>
                    {pctBadge && (
                        <Badge variant="sale">
                            -{Math.round((1 - price / was) * 100)}%
                        </Badge>
                    )}
                </>
            ) : null}
        </p>
    );
}
