import { useId, type ReactNode } from 'react';
import { HalalBadge } from '@/components/halal-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export type OrderSummaryLine = {
    label: string;
    amount: number;
};

type OrderSummaryProps = {
    lines: OrderSummaryLine[];
    total: number;
    title?: string;
    cod?: boolean;
    halal?: boolean;
    loading?: boolean;
    children?: ReactNode;
    className?: string;
};

function formatAmount(amount: number): string {
    const isNegative = amount < 0;
    const formatted = formatPeso(Math.abs(amount));
    return isNegative ? `−${formatted}` : formatted;
}

export function OrderSummary({
    lines,
    total,
    title = 'Payment details',
    cod = false,
    halal = false,
    loading = false,
    children,
    className,
}: OrderSummaryProps) {
    const id = useId();
    const headingId = `${id}-h`;

    if (loading) {
        return (
            <section
                className={cn('panel p-4', className)}
                aria-labelledby={headingId}
            >
                <Skeleton className="mb-4 h-6 w-36" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="mt-4 h-8 w-full" />
                </div>
            </section>
        );
    }

    const formattedTotal = formatAmount(total);

    return (
        <section
            className={cn('panel p-4', className)}
            aria-labelledby={headingId}
        >
            <h2 id={headingId} className="text-h4">
                {title}
            </h2>

            {halal && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-card bg-surface-muted p-2 text-body-sm text-foreground">
                    <HalalBadge status="certified" short />
                    <span className="font-medium">
                        100% Halal certified cart
                    </span>
                </div>
            )}

            <dl className="mt-3 grid gap-2 text-body">
                {lines.map((line, idx) => {
                    const isDiscount = line.amount < 0;
                    return (
                        <div
                            key={idx}
                            className="flex items-baseline justify-between gap-3"
                        >
                            <dt className="text-muted-foreground">
                                {line.label}
                            </dt>
                            <dd
                                className={cn(
                                    'tabular',
                                    isDiscount && 'font-medium text-sale',
                                )}
                            >
                                {isDiscount && (
                                    <span className="sr-only">discount </span>
                                )}
                                {formatAmount(line.amount)}
                            </dd>
                        </div>
                    );
                })}

                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                    <dt className="text-label">Total payment</dt>
                    <dd
                        className="tabular text-price-lg text-sale"
                        aria-live="polite"
                    >
                        {formattedTotal}
                    </dd>
                </div>
            </dl>

            {cod && (
                <p className="mt-2 text-body-sm text-muted-foreground">
                    Pay the rider in cash upon delivery.
                </p>
            )}

            {children && <div className="mt-4">{children}</div>}
        </section>
    );
}
